import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Mail, Phone, MapPin, Clock } from 'lucide-react';

interface HelpPageProps {
  onBack: () => void;
}

export function HelpPage({ onBack }: HelpPageProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: 'How do I check my ID card status?',
      answer: 'After logging in to your student dashboard, your ID card status will be displayed prominently on the main page. You can see whether your ID is being processed, ready for claim, or already claimed.'
    },
    {
      question: 'What do the different status mean?',
      answer: 'Processing: Your ID card is currently being created. Ready for Claim: Your ID card is ready and you can schedule a pickup. Claimed: You have successfully received your ID card.'
    },
    {
      question: 'How long does it take to process my ID?',
      answer: 'ID card processing typically takes 3-5 business days from the date of application. You will receive a notification when your ID status changes.'
    },
    {
      question: 'How do I claim my ID card?',
      answer: 'When your ID status shows "Ready for Claim", you can click the "Request to Claim ID" button on your dashboard. Fill out the claim request form with your preferred pickup date and submit it. The ID office will review and approve your request.'
    },
    {
      question: 'What are the ID office hours?',
      answer: 'The ID office is open Monday to Friday from 8:00 AM to 5:00 PM, and Saturday from 9:00 AM to 12:00 PM. The office is closed on Sundays and public holidays.'
    },
    {
      question: 'What should I bring when claiming my ID?',
      answer: 'Please bring a valid government-issued identification document (such as a passport, driver\'s license, or birth certificate) for verification purposes.'
    },
    {
      question: 'Will I be notified when my status changes?',
      answer: 'Yes! You will receive in-app notifications whenever your ID status is updated. Make sure to check your notification center regularly for important updates.'
    },
    {
      question: 'What if I lost my student ID number?',
      answer: 'Please contact the ID office directly at the contact information provided below. They will help you retrieve your student ID number.'
    },
    {
      question: 'Can someone else claim my ID for me?',
      answer: 'For security reasons, ID cards must be claimed in person. If you have special circumstances, please contact the ID office to discuss alternative arrangements.'
    },
    {
      question: 'I forgot my password. How can I reset it?',
      answer: 'Currently, password reset functionality requires contacting the system administrator. Please reach out to the ID office for assistance with password recovery.'
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-gray-900">Help & FAQ</h1>
              <p className="text-gray-600">Find answers to common questions</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contact Information */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-sm p-8 mb-8 text-white">
          <h2 className="mb-6">ID Office Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
              <div>
                <p className="mb-1 opacity-90">Location</p>
                <p>Student Services Building, Room 101</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 mt-1 flex-shrink-0" />
              <div>
                <p className="mb-1 opacity-90">Phone</p>
                <p>(123) 456-7890</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 mt-1 flex-shrink-0" />
              <div>
                <p className="mb-1 opacity-90">Email</p>
                <p>idoffice@school.edu</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 mt-1 flex-shrink-0" />
              <div>
                <p className="mb-1 opacity-90">Office Hours</p>
                <p>Mon-Fri: 8:00 AM - 5:00 PM</p>
                <p>Sat: 9:00 AM - 12:00 PM</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-gray-900">Frequently Asked Questions</h2>
            <p className="text-gray-600 mt-1">
              Click on a question to view the answer
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {faqs.map((faq, index) => (
              <div key={index}>
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition"
                >
                  <span className="text-gray-900 pr-4">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                
                {openIndex === index && (
                  <div className="px-6 pb-4 text-gray-600">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Help */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-blue-900 mb-2">Still need help?</h3>
          <p className="text-blue-800 mb-4">
            If you couldn&apos;t find the answer to your question, please don&apos;t hesitate to contact the ID office directly using the contact information above.
          </p>
          <p className="text-blue-800">
            For technical issues with the website, please email: <span className="font-medium">techsupport@school.edu</span>
          </p>
        </div>
      </main>
    </div>
  );
}
