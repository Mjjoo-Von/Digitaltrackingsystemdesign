import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Create Supabase client with service role key for admin operations
const getServiceClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );
};

// Create Supabase client with anon key for user operations
const getAnonClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
  );
};

// Health check endpoint
app.get("/make-server-d71c034e/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== AUTH ENDPOINTS ====================

// Sign up endpoint
app.post("/make-server-d71c034e/signup", async (c) => {
  try {
    const { email, password, name, studentId, role = 'student' } = await c.req.json();
    
    if (!email || !password || !name) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const supabase = getServiceClient();
    
    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role, studentId },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (authError) {
      console.log(`Signup error: ${authError.message}`);
      return c.json({ error: authError.message }, 400);
    }

    // Store user profile in KV store
    const userId = authData.user.id;
    await kv.set(`user:${userId}`, {
      id: userId,
      email,
      name,
      role,
      studentId: studentId || null,
      createdAt: new Date().toISOString()
    });

    // If student, create initial ID record
    if (role === 'student' && studentId) {
      await kv.set(`id:${studentId}`, {
        studentId,
        userId,
        status: 'processing',
        studentName: name,
        studentEmail: email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        history: [{
          status: 'processing',
          timestamp: new Date().toISOString(),
          note: 'ID card request submitted'
        }]
      });
    }

    return c.json({ user: authData.user });
  } catch (error) {
    console.log(`Signup error: ${error}`);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// Get current user profile
app.get("/make-server-d71c034e/me", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getServiceClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    return c.json({ user: profile || user });
  } catch (error) {
    console.log(`Get user error: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== ID RECORDS ENDPOINTS ====================

// Get ID record by student ID
app.get("/make-server-d71c034e/id/:studentId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getServiceClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const studentId = c.req.param('studentId');
    const idRecord = await kv.get(`id:${studentId}`);
    
    if (!idRecord) {
      return c.json({ error: 'ID record not found' }, 404);
    }

    // Check if user is authorized to view this record
    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin' && idRecord.userId !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    return c.json({ idRecord });
  } catch (error) {
    console.log(`Get ID record error: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get all ID records (admin only)
app.get("/make-server-d71c034e/ids", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getServiceClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin') {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const records = await kv.getByPrefix('id:');
    return c.json({ records });
  } catch (error) {
    console.log(`Get all ID records error: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update ID status (admin only)
app.put("/make-server-d71c034e/id/:studentId", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getServiceClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin') {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const studentId = c.req.param('studentId');
    const { status, note } = await c.req.json();
    
    const idRecord = await kv.get(`id:${studentId}`);
    if (!idRecord) {
      return c.json({ error: 'ID record not found' }, 404);
    }

    // Update record with new status
    const updatedRecord = {
      ...idRecord,
      status,
      updatedAt: new Date().toISOString(),
      history: [
        ...(idRecord.history || []),
        {
          status,
          timestamp: new Date().toISOString(),
          note: note || `Status updated to ${status}`,
          updatedBy: userProfile.name
        }
      ]
    };

    await kv.set(`id:${studentId}`, updatedRecord);

    // Create notification for student
    const notificationId = `notif:${idRecord.userId}:${Date.now()}`;
    await kv.set(notificationId, {
      userId: idRecord.userId,
      type: 'status_update',
      title: 'ID Status Updated',
      message: `Your ID status has been updated to: ${status}`,
      read: false,
      createdAt: new Date().toISOString()
    });

    return c.json({ idRecord: updatedRecord });
  } catch (error) {
    console.log(`Update ID status error: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== CLAIM REQUESTS ENDPOINTS ====================

// Submit claim request
app.post("/make-server-d71c034e/claim", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getServiceClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { studentId, claimDate, notes } = await c.req.json();
    
    const idRecord = await kv.get(`id:${studentId}`);
    if (!idRecord) {
      return c.json({ error: 'ID record not found' }, 404);
    }

    if (idRecord.status !== 'ready') {
      return c.json({ error: 'ID is not ready for claim' }, 400);
    }

    const claimId = `claim:${studentId}:${Date.now()}`;
    const claim = {
      id: claimId,
      studentId,
      userId: user.id,
      claimDate,
      notes,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await kv.set(claimId, claim);

    return c.json({ claim });
  } catch (error) {
    console.log(`Submit claim request error: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get claim requests (admin only)
app.get("/make-server-d71c034e/claims", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getServiceClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin') {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const claims = await kv.getByPrefix('claim:');
    return c.json({ claims });
  } catch (error) {
    console.log(`Get claim requests error: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== NOTIFICATIONS ENDPOINTS ====================

// Get user notifications
app.get("/make-server-d71c034e/notifications", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getServiceClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allNotifications = await kv.getByPrefix(`notif:${user.id}:`);
    const sortedNotifications = allNotifications.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json({ notifications: sortedNotifications });
  } catch (error) {
    console.log(`Get notifications error: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Mark notification as read
app.put("/make-server-d71c034e/notifications/:id/read", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getServiceClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const notifId = c.req.param('id');
    const notification = await kv.get(notifId);
    
    if (!notification || notification.userId !== user.id) {
      return c.json({ error: 'Notification not found' }, 404);
    }

    await kv.set(notifId, { ...notification, read: true });

    return c.json({ success: true });
  } catch (error) {
    console.log(`Mark notification as read error: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== ANALYTICS ENDPOINTS ====================

// Get dashboard analytics (admin only)
app.get("/make-server-d71c034e/analytics", async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    if (!accessToken) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const supabase = getServiceClient();
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (userProfile.role !== 'admin') {
      return c.json({ error: 'Forbidden - Admin access required' }, 403);
    }

    const allRecords = await kv.getByPrefix('id:');
    
    const statusCounts = {
      processing: 0,
      ready: 0,
      claimed: 0
    };

    allRecords.forEach(record => {
      if (statusCounts.hasOwnProperty(record.status)) {
        statusCounts[record.status]++;
      }
    });

    return c.json({
      total: allRecords.length,
      statusCounts,
      records: allRecords
    });
  } catch (error) {
    console.log(`Get analytics error: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

Deno.serve(app.fetch);
