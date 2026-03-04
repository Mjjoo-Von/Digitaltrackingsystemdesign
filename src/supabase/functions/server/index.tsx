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

// ==================== LOST ID ENDPOINTS ====================

// Submit lost ID report (student)
app.post("/make-server-d71c034e/lost-id", async (c) => {
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

    const { studentId, reason, lastSeenDate, lastSeenLocation, additionalDetails } = await c.req.json();
    
    const idRecord = await kv.get(`id:${studentId}`);
    if (!idRecord) {
      return c.json({ error: 'ID record not found' }, 404);
    }

    if (idRecord.userId !== user.id) {
      return c.json({ error: 'Forbidden' }, 403);
    }

    const reportId = `lost:${studentId}:${Date.now()}`;
    const report = {
      id: reportId,
      studentId,
      userId: user.id,
      studentName: idRecord.studentName,
      studentEmail: idRecord.studentEmail,
      reason: reason || 'Lost',
      lastSeenDate: lastSeenDate || null,
      lastSeenLocation: lastSeenLocation || '',
      additionalDetails: additionalDetails || '',
      status: 'pending_review',
      createdAt: new Date().toISOString(),
    };

    await kv.set(reportId, report);

    // Update ID record to reflect lost status
    const updatedRecord = {
      ...idRecord,
      lostReported: true,
      lostReportedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        ...(idRecord.history || []),
        {
          status: 'lost_reported',
          timestamp: new Date().toISOString(),
          note: `Lost ID reported. Reason: ${reason || 'Lost'}`,
        }
      ]
    };
    await kv.set(`id:${studentId}`, updatedRecord);

    // Notify admin (create an admin notification)
    const adminNotifId = `notif:admin:lost:${studentId}:${Date.now()}`;
    await kv.set(adminNotifId, {
      type: 'lost_id_report',
      title: 'Lost ID Report',
      message: `Student ${idRecord.studentName} (${studentId}) has reported their ID as lost.`,
      studentId,
      userId: user.id,
      read: false,
      createdAt: new Date().toISOString(),
    });

    // Notify student
    const studentNotifId = `notif:${user.id}:lost:${Date.now()}`;
    await kv.set(studentNotifId, {
      userId: user.id,
      type: 'lost_id_report',
      title: 'Lost ID Report Submitted',
      message: 'Your lost ID report has been submitted. The admin will review it shortly.',
      read: false,
      createdAt: new Date().toISOString(),
    });

    return c.json({ report });
  } catch (error) {
    console.log(`Submit lost ID report error: ${error}`);
    return c.json({ error: 'Internal server error during lost ID report submission' }, 500);
  }
});

// Get all lost ID reports (admin only)
app.get("/make-server-d71c034e/lost-ids", async (c) => {
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

    const reports = await kv.getByPrefix('lost:');
    const sorted = reports.sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return c.json({ reports: sorted });
  } catch (error) {
    console.log(`Get lost ID reports error: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Update lost ID report status (admin only)
app.put("/make-server-d71c034e/lost-id/:reportId", async (c) => {
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

    const reportId = decodeURIComponent(c.req.param('reportId'));
    const { status, adminNote } = await c.req.json();

    const report = await kv.get(reportId);
    if (!report) {
      return c.json({ error: 'Report not found' }, 404);
    }

    const updatedReport = {
      ...report,
      status,
      adminNote: adminNote || '',
      resolvedAt: new Date().toISOString(),
      resolvedBy: userProfile.name,
    };
    await kv.set(reportId, updatedReport);

    // Notify student
    const notifId = `notif:${report.userId}:lostupdate:${Date.now()}`;
    await kv.set(notifId, {
      userId: report.userId,
      type: 'lost_id_update',
      title: 'Lost ID Report Updated',
      message: `Your lost ID report has been updated to: ${status}. ${adminNote ? 'Note: ' + adminNote : ''}`,
      read: false,
      createdAt: new Date().toISOString(),
    });

    return c.json({ report: updatedReport });
  } catch (error) {
    console.log(`Update lost ID report error: ${error}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// ==================== REPLACE ID ENDPOINTS ====================

// Initiate ID replacement (admin only)
app.post("/make-server-d71c034e/replace-id", async (c) => {
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

    const { studentId, lostReportId, replacementFee, estimatedReadyDate, adminNote } = await c.req.json();

    if (!studentId) {
      return c.json({ error: 'studentId is required' }, 400);
    }

    const idRecord = await kv.get(`id:${studentId}`);
    if (!idRecord) {
      return c.json({ error: 'ID record not found' }, 404);
    }

    const now = new Date().toISOString();
    const replacementId = `replace:${studentId}:${Date.now()}`;

    // Store replacement record
    const replacement = {
      id: replacementId,
      studentId,
      userId: idRecord.userId,
      studentName: idRecord.studentName,
      studentEmail: idRecord.studentEmail,
      lostReportId: lostReportId || null,
      replacementFee: replacementFee || 0,
      estimatedReadyDate: estimatedReadyDate || null,
      adminNote: adminNote || '',
      initiatedBy: userProfile.name,
      initiatedAt: now,
      status: 'processing',
    };
    await kv.set(replacementId, replacement);

    // Reset the ID record back to processing and clear lost flags
    const updatedRecord = {
      ...idRecord,
      status: 'processing',
      lostReported: false,
      replacementInitiated: true,
      replacementInitiatedAt: now,
      replacementId,
      updatedAt: now,
      history: [
        ...(idRecord.history || []),
        {
          status: 'replacement_initiated',
          timestamp: now,
          note: `Replacement ID initiated by ${userProfile.name}. ${adminNote ? 'Note: ' + adminNote : ''}${replacementFee ? ' Fee: ₱' + replacementFee : ''}${estimatedReadyDate ? ' Est. ready: ' + new Date(estimatedReadyDate).toLocaleDateString() : ''}`,
          updatedBy: userProfile.name,
        }
      ]
    };
    await kv.set(`id:${studentId}`, updatedRecord);

    // Mark the lost report as resolved if provided
    if (lostReportId) {
      const lostReport = await kv.get(lostReportId);
      if (lostReport) {
        await kv.set(lostReportId, {
          ...lostReport,
          status: 'resolved',
          resolvedAt: now,
          resolvedBy: userProfile.name,
          adminNote: adminNote || lostReport.adminNote || '',
        });
      }
    }

    // Notify student
    const notifId = `notif:${idRecord.userId}:replace:${Date.now()}`;
    await kv.set(notifId, {
      userId: idRecord.userId,
      type: 'replacement_initiated',
      title: 'Replacement ID Initiated',
      message: `Your replacement ID is now being processed.${replacementFee ? ' A replacement fee of ₱' + replacementFee + ' is required.' : ''}${estimatedReadyDate ? ' Estimated ready date: ' + new Date(estimatedReadyDate).toLocaleDateString() + '.' : ''}${adminNote ? ' Note: ' + adminNote : ''}`,
      read: false,
      createdAt: now,
    });

    return c.json({ replacement, idRecord: updatedRecord });
  } catch (error) {
    console.log(`Initiate replacement error: ${error}`);
    return c.json({ error: 'Internal server error during replacement initiation' }, 500);
  }
});

// Get replacement records (admin only)
app.get("/make-server-d71c034e/replacements", async (c) => {
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

    const replacements = await kv.getByPrefix('replace:');
    const sorted = replacements.sort((a: any, b: any) =>
      new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime()
    );
    return c.json({ replacements: sorted });
  } catch (error) {
    console.log(`Get replacements error: ${error}`);
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