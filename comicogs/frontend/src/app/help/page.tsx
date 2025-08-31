"use client";

export const dynamic = 'force-dynamic'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  MessageSquare, 
  HelpCircle, 
  Book, 
  Shield, 
  CreditCard,
  Truck,
  Star,
  Phone,
  Mail,
  Clock
} from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";

export default function HelpPage() {
  const faqCategories = [
    {
      id: "buying",
      title: "Buying Comics",
      icon: <Book className="h-5 w-5" />,
      questions: [
        {
          question: "How do I place a bid?",
          answer: "Click on any comic listing, then click the 'Place Bid' button. Enter your bid amount (must be higher than current bid) and confirm."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers."
        },
        {
          question: "How do I know if a comic is authentic?",
          answer: "All our sellers are verified, and we offer authentication services. Look for the verified seller badge and authenticity certificates."
        }
      ]
    },
    {
      id: "selling",
      title: "Selling Comics",
      icon: <CreditCard className="h-5 w-5" />,
      questions: [
        {
          question: "How do I list a comic for sale?",
          answer: "Go to the Sell page, fill out the comic details, upload photos, set your price, and publish your listing."
        },
        {
          question: "What fees do you charge?",
          answer: "We charge a 5% final value fee on successful sales. Listing is free, and there are no monthly fees."
        },
        {
          question: "How do I get paid?",
          answer: "Payments are processed within 2-3 business days after the buyer receives and confirms the item."
        }
      ]
    },
    {
      id: "shipping",
      title: "Shipping & Returns",
      icon: <Truck className="h-5 w-5" />,
      questions: [
        {
          question: "How long does shipping take?",
          answer: "Standard shipping takes 3-5 business days. Express options are available for faster delivery."
        },
        {
          question: "Can I return a comic?",
          answer: "Yes, we have a 30-day return policy if the item doesn't match the description or arrives damaged."
        },
        {
          question: "Do you ship internationally?",
          answer: "Yes, we ship worldwide. International shipping costs and times vary by destination."
        }
      ]
    },
    {
      id: "account",
      title: "Account & Security",
      icon: <Shield className="h-5 w-5" />,
      questions: [
        {
          question: "How do I reset my password?",
          answer: "Click 'Forgot Password' on the login page and follow the instructions sent to your email."
        },
        {
          question: "Is my payment information secure?",
          answer: "Yes, we use industry-standard encryption and never store your full payment details."
        },
        {
          question: "How do I delete my account?",
          answer: "Contact our support team to permanently delete your account and all associated data."
        }
      ]
    }
  ];

  const contactMethods = [
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Live Chat",
      description: "Chat with our support team",
      availability: "Available 9 AM - 6 PM EST",
      action: "Start Chat",
      primary: true
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Email Support",
      description: "help@comicogs.com",
      availability: "Response within 24 hours",
      action: "Send Email",
      primary: false
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: "Phone Support",
      description: "1-800-COMICOGS",
      availability: "Mon-Fri, 9 AM - 6 PM EST",
      action: "Call Now",
      primary: false
    }
  ];

  return (
    <AppShell
      pageTitle="Help Center"
      pageDescription="Get help with buying, selling, and using Comicogs"
    >
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Help Center</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions, get support, and learn how to make the most of Comicogs.
            </p>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="p-6">
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10 text-lg h-12"
                  placeholder="Search for help articles, guides, or FAQs..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Contact Methods */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <Card key={index} className={method.primary ? "border-primary" : ""}>
                <CardContent className="p-6 text-center space-y-4">
                  <div className={`p-3 rounded-lg inline-flex ${method.primary ? "bg-primary/10" : "bg-muted"}`}>
                    {method.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{method.title}</h3>
                    <p className="text-muted-foreground">{method.description}</p>
                    <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mt-2">
                      <Clock className="h-3 w-3" />
                      <span>{method.availability}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    variant={method.primary ? "default" : "outline"}
                  >
                    {method.action}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* FAQ Tabs */}
          <Tabs defaultValue="buying" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              {faqCategories.map((category) => (
                <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                  {category.icon}
                  <span className="hidden sm:inline">{category.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {faqCategories.map((category) => (
              <TabsContent key={category.id} value={category.id} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {category.icon}
                      {category.title}
                    </CardTitle>
                    <CardDescription>
                      Frequently asked questions about {category.title.toLowerCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {category.questions.map((faq, index) => (
                        <div key={index} className="space-y-2">
                          <h4 className="font-medium flex items-start gap-2">
                            <HelpCircle className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                            {faq.question}
                          </h4>
                          <p className="text-muted-foreground ml-6">
                            {faq.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Popular Guides */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-center">Popular Guides</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 bg-primary/10 rounded-lg inline-flex">
                    <Book className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Comic Grading Guide</h3>
                    <p className="text-muted-foreground">Learn how to accurately grade your comics and understand condition ratings.</p>
                  </div>
                  <Button variant="outline" className="w-full">
                    Read Guide
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg inline-flex">
                    <Star className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Successful Selling Tips</h3>
                    <p className="text-muted-foreground">Maximize your sales with photography, pricing, and listing optimization tips.</p>
                  </div>
                  <Button variant="outline" className="w-full">
                    Read Guide
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg inline-flex">
                    <Shield className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Safe Trading Practices</h3>
                    <p className="text-muted-foreground">Stay safe when buying and selling comics online with our security guidelines.</p>
                  </div>
                  <Button variant="outline" className="w-full">
                    Read Guide
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Still Need Help */}
          <Card className="bg-muted/50">
            <CardContent className="p-8 text-center space-y-4">
              <h3 className="text-2xl font-bold">Still Need Help?</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Can't find what you're looking for? Our support team is here to help you with any questions or issues.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contact Support
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/marketplace">
                    Browse Comics
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppShell>
  );
}