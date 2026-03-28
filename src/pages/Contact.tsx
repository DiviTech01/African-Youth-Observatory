import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, MapPin, Phone, Clock, Send, MessageSquare, Building, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const Contact = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    inquiryType: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message Sent",
      description: "Thank you for contacting us. We'll respond within 2-3 business days.",
    });
    setFormData({
      name: '',
      email: '',
      organization: '',
      inquiryType: '',
      subject: '',
      message: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <>
      <header className="relative py-8 md:py-12 overflow-hidden">
        <div className="absolute inset-0 opacity-30 w-full bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:6rem_5rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
        <div className="container px-4 md:px-6 relative z-10">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tighter bg-gradient-to-br from-[#D4A017] from-10% via-white via-40% to-white/40 bg-clip-text text-transparent mb-2">{t('contact.title')}</h1>
          <p className="text-[#A89070]">
            {t('contact.subtitle')}
          </p>
        </div>
      </header>

      <div className="py-6 md:py-8">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Contact Information */}
            <div className="space-y-4 lg:col-span-1">
              <Card className="bg-white/[0.03] border-gray-800 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="h-5 w-5 text-[#D4A017]" />
                    Email
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-gray-400">General Inquiries:</p>
                  <a href="mailto:info@africanyouthdata.org" className="text-primary hover:underline block">
                    info@africanyouthdata.org
                  </a>
                  <p className="text-gray-400 mt-3">Data Requests:</p>
                  <a href="mailto:data@africanyouthdata.org" className="text-primary hover:underline block">
                    data@africanyouthdata.org
                  </a>
                  <p className="text-gray-400 mt-3">Partnerships:</p>
                  <a href="mailto:partnerships@africanyouthdata.org" className="text-primary hover:underline block">
                    partnerships@africanyouthdata.org
                  </a>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.03] border-gray-800 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building className="h-5 w-5 text-[#D4A017]" />
                    Organization
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="font-medium">PACSDA</p>
                  <p className="text-gray-400">Pan-African Centre for Statistics and Data Analytics</p>
                  <p className="text-gray-400 mt-2">Implementing Partner:</p>
                  <p className="font-medium">ZeroUp Next</p>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.03] border-gray-800 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#D4A017]" />
                    Response Time
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-gray-400">
                  <p>We typically respond to inquiries within 2-3 business days.</p>
                  <p className="mt-2">For urgent data requests, please indicate in your subject line.</p>
                </CardContent>
              </Card>

              <Card className="bg-white/[0.03] border-gray-800 rounded-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#D4A017]" />
                    Connect With Us
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <a href="#" className="p-2 rounded-full bg-white/[0.05] border border-gray-800 hover:bg-white/[0.1] transition-colors">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                      </svg>
                    </a>
                    <a href="#" className="p-2 rounded-full bg-white/[0.05] border border-gray-800 hover:bg-white/[0.1] transition-colors">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/>
                      </svg>
                    </a>
                    <a href="#" className="p-2 rounded-full bg-white/[0.05] border border-gray-800 hover:bg-white/[0.1] transition-colors">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                      </svg>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <Card className="lg:col-span-2 bg-white/[0.03] border-gray-800 rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[#D4A017]" />
                  Send us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        required
                        className="border-gray-800 bg-white/[0.03]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        required
                        className="border-gray-800 bg-white/[0.03]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="organization">Organization</Label>
                      <Input
                        id="organization"
                        name="organization"
                        value={formData.organization}
                        onChange={handleChange}
                        placeholder="Your organization"
                        className="border-gray-800 bg-white/[0.03]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inquiryType">Inquiry Type *</Label>
                      <Select 
                        value={formData.inquiryType}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, inquiryType: value }))}
                      >
                        <SelectTrigger className="border-gray-800 bg-white/[0.03]">
                          <SelectValue placeholder="Select inquiry type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General Inquiry</SelectItem>
                          <SelectItem value="data-request">Data Request</SelectItem>
                          <SelectItem value="partnership">Partnership Opportunity</SelectItem>
                          <SelectItem value="technical">Technical Support</SelectItem>
                          <SelectItem value="media">Media Inquiry</SelectItem>
                          <SelectItem value="feedback">Feedback</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Brief subject of your inquiry"
                      required
                      className="border-gray-800 bg-white/[0.03]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Please describe your inquiry in detail..."
                      rows={5}
                      required
                      className="border-gray-800 bg-white/[0.03]"
                    />
                  </div>

                  <div className="flex items-center gap-4">
                    <Button type="submit" className="gap-2">
                      <Send className="h-4 w-4" />
                      Send Message
                    </Button>
                    <p className="text-xs text-gray-400">
                      * Required fields
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
