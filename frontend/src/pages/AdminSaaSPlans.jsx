import React, { useState } from 'react';
import { CheckCircle2, XCircle, Zap, Shield, Globe, Cpu, X } from 'lucide-react';
import api from '../services/api';

const AdminSaaSPlans = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    organization: '',
    email: '',
    phone: ''
  });

  const handleSubscribe = (plan) => {
    setSelectedPlan(plan);
    setIsModalOpen(true);
    setIsSubmitted(false);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const res = await api.post('/admin/subscribe', {
        ...formData,
        plan: selectedPlan.name
      });

      if (res.status === 200) {
        setIsSubmitted(true);
        setTimeout(() => {
          setIsModalOpen(false);
          setIsSubmitted(false);
          setFormData({ organization: '', email: '', phone: '' });
        }, 3000);
      } else {
        alert("Failed to send subscription request.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred.");
    }
  };

  const plans = [
    {
      name: "Starter",
      description: "Perfect for single societies or small parking lots.",
      price: "₹4,999",
      period: "/month",
      features: [
        { name: "Up to 100 Parking Slots", included: true },
        { name: "Mobile Booking for Drivers", included: true },
        { name: "Operator Dashboard", included: true },
        { name: "Digital Payments", included: true },
        { name: "Advanced Analytics", included: false },
        { name: "Custom Domain", included: false },
        { name: "24/7 Priority Support", included: false },
      ],
      cta: "Get Started",
      highlighted: false,
    },
    {
      name: "Professional",
      description: "Ideal for malls, hospitals, and growing businesses.",
      price: "₹14,999",
      period: "/month",
      features: [
        { name: "Up to 500 Parking Slots", included: true },
        { name: "Mobile Booking for Drivers", included: true },
        { name: "Operator Dashboard", included: true },
        { name: "Digital Payments", included: true },
        { name: "Advanced Analytics", included: true },
        { name: "Multi-Zone Management", included: true },
        { name: "Custom Domain", included: false },
        { name: "24/7 Priority Support", included: false },
      ],
      cta: "Start Free Trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      description: "For airports, large universities, and city-wide deployments.",
      price: "Custom",
      period: "",
      features: [
        { name: "Unlimited Parking Slots", included: true },
        { name: "Mobile Booking for Drivers", included: true },
        { name: "Operator Dashboard", included: true },
        { name: "Digital Payments", included: true },
        { name: "Advanced Analytics", included: true },
        { name: "Multi-Zone Management", included: true },
        { name: "Custom Domain", included: true },
        { name: "24/7 Priority Support", included: true },
      ],
      cta: "Contact Sales",
      highlighted: false,
    }
  ];

  return (
    <div className="max-w-7xl mx-auto pb-12 relative">
      {/* Header Section */}
      <div className="text-center mb-16 pt-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-medium text-sm mb-6 border border-blue-100">
          <Cpu className="w-4 h-4" />
          <span>100% Software-Based • Zero Hardware Costs</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
          Transform Any Parking Space <br className="hidden md:block" />
          <span className="text-blue-600">Into a Smart System</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
          Scale your parking business with our Multi-Tenant SaaS platform. 
          No expensive IoT sensors, no RFID, no cameras. Just deploy our software and start managing your slots across India today.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {plans.map((plan, index) => (
          <div 
            key={index}
            className={`relative rounded-2xl bg-white border ${
              plan.highlighted 
                ? 'border-blue-600 shadow-xl shadow-blue-900/5 transform md:-translate-y-4' 
                : 'border-gray-200 shadow-lg hover:shadow-xl'
            } transition-all duration-300 flex flex-col`}
          >
            {plan.highlighted && (
              <div className="absolute top-0 inset-x-0 transform -translate-y-1/2 flex justify-center">
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold px-4 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Zap className="w-4 h-4" /> Most Popular
                </span>
              </div>
            )}
            
            <div className="p-8 flex-1">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-500 text-sm mb-6 h-10">{plan.description}</p>
              
              <div className="mb-8 flex items-baseline">
                <span className="text-4xl font-extrabold text-gray-900">{plan.price}</span>
                <span className="text-gray-500 ml-1 font-medium">{plan.period}</span>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.filter(f => f.included).map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mr-3 mt-0.5" />
                    <span className="text-gray-700">
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-8 pt-0 mt-auto">
              <button 
                className={`w-full py-3 px-6 rounded-xl font-bold transition-all duration-200 ${
                  plan.highlighted
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
                onClick={() => handleSubscribe(plan)}
              >
                {plan.cta}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Feature Highlights */}
      <div className="mt-20 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto px-4 text-center">
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Globe className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold text-gray-900 mb-2">Deploy Anywhere</h4>
          <p className="text-gray-600 text-sm">Sell access to any hospital, mall, or commercial building across India instantly.</p>
        </div>

        <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-bold text-gray-900 mb-2">Enterprise Ready</h4>
          <p className="text-gray-600 text-sm">Production-level architecture designed to scale with your multi-tenant parking network.</p>
        </div>
      </div>

      {/* Subscription Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedPlan?.name === 'Enterprise' ? 'Contact Sales' : 'Complete Subscription'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Selected Plan: <span className="font-semibold text-blue-600">{selectedPlan?.name} ({selectedPlan?.price})</span>
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {isSubmitted ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Request Received!</h4>
                <p className="text-gray-600">
                  Our team will contact you shortly to set up your admin dashboard for your parking zones.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                  <input required name="organization" value={formData.organization} onChange={handleInputChange} type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none" placeholder="e.g. Parul University" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input required name="email" value={formData.email} onChange={handleInputChange} type="email" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input required name="phone" value={formData.phone} onChange={handleInputChange} type="tel" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent outline-none" placeholder="+91 98765 43210" />
                </div>
                
                <button 
                  type="submit"
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                >
                  {selectedPlan?.name === 'Enterprise' ? 'Submit Request' : 'Proceed to Payment'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSaaSPlans;
