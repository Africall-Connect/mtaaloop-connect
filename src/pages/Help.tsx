import { Link } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MessageCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const Help = () => {
  const contactOptions = [
    {
      icon: Phone,
      title: "Call Us",
      description: "+254 712 345 678",
      action: "Call Now",
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "support@mtaalopp.com",
      action: "Send Email",
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our team",
      action: "Start Chat",
    },
  ];

  const faqs = [
    {
      question: "How do I place an order?",
      answer: "Browse vendors, add items to cart, and checkout. Delivery is usually 5-15 minutes within your building.",
    },
    {
      question: "What payment methods are accepted?",
      answer: "We accept M-Pesa, credit/debit cards, and cash on delivery.",
    },
    {
      question: "How fast is delivery?",
      answer: "Delivery from vendors in your building takes 5-15 minutes. Nearby vendors may take up to 30 minutes.",
    },
    {
      question: "Can I cancel my order?",
      answer: "You can cancel within 2 minutes of placing the order. After that, please contact the vendor directly.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-4 py-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/account">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">❓ Help & Support</h1>
        </div>

        {/* Contact Options */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Contact Us</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {contactOptions.map((option) => {
              const Icon = option.icon;
              return (
                <Card key={option.title} className="p-4 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{option.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {option.description}
                  </p>
                  <Button size="sm" variant="outline" className="w-full">
                    {option.action}
                  </Button>
                </Card>
              );
            })}
          </div>
        </div>

        {/* FAQs */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
          <Card className="p-4">
            <Accordion type="single" collapsible>
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Help;
