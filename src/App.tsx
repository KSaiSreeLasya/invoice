import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import { toPng } from 'html-to-image';
import {
  FileText,
  Palette,
  Sliders,
  Type as TypeIcon,
  Download,
  Printer,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Receipt,
  RefreshCw,
  Undo2,
  FileSignature,
  Building,
  Mail,
  Phone,
  Calendar,
  Layers,
  Sparkles,
  ChevronRight,
  User,
  Hash,
  AlertCircle,
  Coins
} from 'lucide-react';

// Define the shape of a line item
interface LineItem {
  id: string;
  sku?: string;
  dateOfService?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  itemDiscount?: number; // per line discount percentage
}

// Define the shape of a payslip item
interface PayslipItem {
  id: string;
  name: string;
  amount: number;
}

// Convert numbers to English words helper for professional payslips in Rupees (Lakhs & Crores)
const numberToWords = (num: number): string => {
  if (num <= 0) return 'Zero Rupees Only';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convertLessThanThousand = (n: number): string => {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + ' ';
    }
    return str.trim();
  };

  const integerPart = Math.floor(num);
  const paise = Math.round((num - integerPart) * 100);
  
  const convertIndianSystem = (n: number): string => {
    if (n === 0) return '';
    let str = '';
    
    // Crores (1,00,00,000)
    if (n >= 10000000) {
      str += convertLessThanThousand(Math.floor(n / 10000000)) + ' Crore ';
      n %= 10000000;
    }
    // Lakhs (1,00,000)
    if (n >= 100000) {
      str += convertLessThanThousand(Math.floor(n / 100000)) + ' Lakh ';
      n %= 100000;
    }
    // Thousands (1,000)
    if (n >= 1000) {
      str += convertLessThanThousand(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }
    // Remainder
    if (n > 0) {
      str += convertLessThanThousand(n);
    }
    return str.trim();
  };
  
  let result = convertIndianSystem(integerPart);
  result = result.trim() + ' Rupees';
  if (paise > 0) {
    result += ' and ' + convertLessThanThousand(paise) + ' Paise';
  }
  return result.replace(/\s+/g, ' ') + ' Only';
};

// Preset logo generator options
const LOGO_PRESETS = [
  { id: 'creative', name: 'Creative Spark', icon: '✦', bg: 'bg-indigo-600', text: 'text-white' },
  { id: 'tech', name: 'Nexus Tech', icon: '⬢', bg: 'bg-slate-900', text: 'text-emerald-400' },
  { id: 'delivery', name: 'Apex Delivery', icon: '▲', bg: 'bg-rose-600', text: 'text-white' },
  { id: 'trade', name: 'Global Trade', icon: '◆', bg: 'bg-amber-500', text: 'text-slate-950' },
  { id: 'medical', name: 'MedCare', icon: '✚', bg: 'bg-emerald-600', text: 'text-white' },
];

// Color palette options
const COLOR_PALETTES = [
  { id: 'indigo', name: 'Classic Indigo', hex: '#4f46e5', ring: 'ring-indigo-600' },
  { id: 'slate', name: 'Dark Slate', hex: '#0f172a', ring: 'ring-slate-900' },
  { id: 'emerald', name: 'Pure Emerald', hex: '#059669', ring: 'ring-emerald-600' },
  { id: 'rose', name: 'Vibrant Rose', hex: '#e11d48', ring: 'ring-rose-600' },
  { id: 'amber', name: 'Warm Amber', hex: '#d97706', ring: 'ring-amber-500' },
];

export default function App() {
  // --- CORE APP STATE ---
  const [docType, setDocType] = useState<'invoice' | 'estimate' | 'proforma' | 'delivery' | 'receipt' | 'credit' | 'payslip'>('invoice');
  const [activeTab, setActiveTab] = useState<'branding' | 'grid' | 'footer' | 'ecosystem'>('branding');

  // Theme states
  const [brandColor, setBrandColor] = useState('#4f46e5');
  const [typography, setTypography] = useState<'sans' | 'serif' | 'mono'>('sans');
  const [compactRows, setCompactRows] = useState(false);

  // --- PAYSLIP SYSTEM STATES ---
  const [employeeName, setEmployeeName] = useState('Sarah Connor');
  const [employeeId, setEmployeeId] = useState('EMP-2026-0042');
  const [employeeRole, setEmployeeRole] = useState('Lead Senior Architect');
  const [employeeDept, setEmployeeDept] = useState('Engineering & AI Systems');
  const [payPeriod, setPayPeriod] = useState('July 2026');
  const [employeeBank, setEmployeeBank] = useState('JPMorgan Chase Bank');
  const [employeeAccount, setEmployeeAccount] = useState('XXXX-XXXX-8821');
  const [employeeTaxId, setEmployeeTaxId] = useState('PAN-AAACT9827F');
  const [salaryInWords, setSalaryInWords] = useState('');

  const [earnings, setEarnings] = useState<PayslipItem[]>([
    { id: 'earn-1', name: 'Basic Salary', amount: 6500 },
    { id: 'earn-2', name: 'House Rent Allowance (HRA)', amount: 2000 },
    { id: 'earn-3', name: 'Special Allowance', amount: 1200 },
    { id: 'earn-4', name: 'Performance Bonus', amount: 800 },
    { id: 'earn-5', name: 'Medical Reimbursement', amount: 250 },
  ]);

  const [deductions, setDeductions] = useState<PayslipItem[]>([
    { id: 'ded-1', name: 'Provident Fund (PF)', amount: 780 },
    { id: 'ded-2', name: 'Professional Tax', amount: 200 },
    { id: 'ded-3', name: 'TDS / Income Tax', amount: 950 },
    { id: 'ded-4', name: 'Health Insurance Premium', amount: 150 },
  ]);

  // Branding states
  const [logoPreset, setLogoPreset] = useState<string>('creative');
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState('Creative Studio Inc.');
  const [companyAddress, setCompanyAddress] = useState('123 Design Avenue, San Francisco, CA 94103');
  const [companyPhone, setCompanyPhone] = useState('+1 (555) 019-2834');
  const [companyEmail, setCompanyEmail] = useState('billing@creativestudio.design');
  const [companyTaxLabel, setCompanyTaxLabel] = useState('VAT ID');
  const [companyTaxValue, setCompanyTaxValue] = useState('GB987654321');

  // Client states
  const [clientName, setClientName] = useState('Acme Corporation');
  const [clientAddress, setClientAddress] = useState('450 Enterprise Way, Mountain View, CA 94043');
  const [clientPhone, setClientPhone] = useState('+1 (650) 555-0100');
  const [clientEmail, setClientEmail] = useState('accounts@acme.com');

  // Mechanics states
  const [invoicePrefix, setInvoicePrefix] = useState('INV-');
  const [invoiceNumber, setInvoiceNumber] = useState('2026-1001');
  const [issueDate, setIssueDate] = useState('2026-07-07');
  const [dueDate, setDueDate] = useState('2026-07-22');
  const [paymentTerms, setPaymentTerms] = useState('Net 15');

  // Grid states
  const [colQtyLabel, setColQtyLabel] = useState('Qty');
  const [colRateLabel, setColRateLabel] = useState('Rate');
  const [showSkuColumn, setShowSkuColumn] = useState(false);
  const [showServiceDateColumn, setShowServiceDateColumn] = useState(false);

  // Tax and Discounting states
  const [taxLabel, setTaxLabel] = useState('VAT');
  const [taxPercent, setTaxPercent] = useState(20);
  const [discountEnabled, setDiscountEnabled] = useState(false);
  const [discountType, setDiscountType] = useState<'line-item' | 'total'>('total');
  const [totalDiscountPercent, setTotalDiscountPercent] = useState(10);

  // Footer text states
  const [paymentInstructionsHeading, setPaymentInstructionsHeading] = useState('Bank Details');
  const [paymentInstructions, setPaymentInstructions] = useState('Bank Transfer: Chase Bank • Account: 9876-5432-10 • Routing: 121000248 • Payment Link: pay.creativestudio.design/inv-2026-1001');
  const [finePrint, setFinePrint] = useState('Payment terms: Net 15 days. Standard 1.5% interest rate charged monthly on late balances.');

  // Line items states
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: 'item-1',
      sku: 'ST-001',
      dateOfService: '2026-07-01',
      description: 'Brand Strategy & Identity Design (Complete visual language overhaul)',
      quantity: 1,
      unitPrice: 4500,
      itemDiscount: 0
    },
    {
      id: 'item-2',
      sku: 'WD-042',
      dateOfService: '2026-07-05',
      description: 'Website Development - Next.js & Tailwind CSS responsive layout (6 subpages)',
      quantity: 1,
      unitPrice: 8200,
      itemDiscount: 10
    },
    {
      id: 'item-3',
      sku: 'LC-991',
      dateOfService: '2026-07-06',
      description: 'Premium Typeface & High-Res Stock Asset Licensing fees',
      quantity: 1,
      unitPrice: 350,
      itemDiscount: 0
    }
  ]);

  // --- ECOSYSTEM DOCUMENT SPECIFIC STATES ---
  // 1. Estimates / Quotations
  const [estimateTerminology, setEstimateTerminology] = useState<'Estimate' | 'Quote' | 'Proposal'>('Estimate');
  const [validityDays, setValidityDays] = useState(30);
  const [estimateSigned, setEstimateSigned] = useState(false);
  const [signerName, setSignerName] = useState('Acme Corp Rep');
  const [signerSignature, setSignerSignature] = useState('Jane Doe');
  const [preSaleTerms, setPreSaleTerms] = useState('This proposal is valid for 30 days. Project kick-off requires signed acceptance and a 50% deposit.');

  // 2. Proforma Invoices
  const [advanceRequirementPercent, setAdvanceRequirementPercent] = useState(50);
  const [proformaConverted, setProformaConverted] = useState(false);

  // 3. Delivery Notes / Packing Slips
  const [courierName, setCourierName] = useState('Apex Express');
  const [trackingNumber, setTrackingNumber] = useState('TRK-9824-0012');
  const [dispatchNumber, setDispatchNumber] = useState('DSP-44012');
  const [showBoxMetrics, setShowBoxMetrics] = useState(true);
  const [cargoWeight, setCargoWeight] = useState('14.5 kg');
  const [cargoDimensions, setCargoDimensions] = useState('40x30x30 cm');
  const [cargoBoxes, setCargoBoxes] = useState(2);
  const [deliveryReceivedBy, setDeliveryReceivedBy] = useState('');
  const [deliveryReceivedDate, setDeliveryReceivedDate] = useState('');

  // 4. Payment Receipts
  const [paymentDate, setPaymentDate] = useState('2026-07-08');
  const [amountReceived, setAmountReceived] = useState(13050);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Wire' | 'Stripe' | 'Cheque'>('Wire');
  const [receiptThankYouMessage, setReceiptThankYouMessage] = useState('Thank you for your prompt payment! We look forward to continuing our partnership.');

  // 5. Credit Notes
  const [reasonForCredit, setReasonForCredit] = useState('Double charging corrections - adjusted rates according to the enterprise contract update.');
  const [managerApproved, setManagerApproved] = useState(true);
  const [managerName, setManagerName] = useState('Sarah Jenkins (Billing VP)');
  const [restockingFeePercent, setRestockingFeePercent] = useState(0);

  // --- BUSINESS MODEL PRESETS ---
  const applyPreset = (presetType: 'creative' | 'ecommerce' | 'saas' | 'contractor') => {
    if (presetType === 'creative') {
      setBrandColor('#4f46e5');
      setTypography('sans');
      setLogoPreset('creative');
      setCompanyName('Creative Studio Inc.');
      setCompanyAddress('123 Design Avenue, San Francisco, CA 94103');
      setCompanyTaxLabel('VAT ID');
      setCompanyTaxValue('GB987654321');
      setColQtyLabel('Qty');
      setColRateLabel('Rate');
      setTaxLabel('VAT');
      setTaxPercent(20);
      setDiscountEnabled(true);
      setDiscountType('total');
      setTotalDiscountPercent(10);
      setLineItems([
        { id: 'c-1', description: 'Brand Strategy & Visual Guidelines', quantity: 1, unitPrice: 4500 },
        { id: 'c-2', description: 'Full Website Development (Next.js)', quantity: 120, unitPrice: 75 } // Hours billable
      ]);
      setPaymentTerms('Net 15');
    } else if (presetType === 'ecommerce') {
      setBrandColor('#e11d48');
      setTypography('sans');
      setLogoPreset('delivery');
      setCompanyName('Zenith E-Commerce Co.');
      setCompanyAddress('Warehouse 4B, Industrial Park, Chicago, IL 60609');
      setCompanyTaxLabel('Tax ID / EIN');
      setCompanyTaxValue('12-3456789');
      setColQtyLabel('Quantity');
      setColRateLabel('Unit Price');
      setShowSkuColumn(true);
      setTaxLabel('Sales Tax');
      setTaxPercent(8.5);
      setDiscountEnabled(true);
      setDiscountType('line-item');
      setLineItems([
        { id: 'e-1', sku: 'SKU-POD-09', description: 'Premium Wireless Earbuds Pro', quantity: 25, unitPrice: 89 },
        { id: 'e-2', sku: 'SKU-WCH-11', description: 'Smart Fitness Watch Series 4', quantity: 10, unitPrice: 199 }
      ]);
      setPaymentTerms('Due on Receipt');
    } else if (presetType === 'saas') {
      setBrandColor('#0f172a');
      setTypography('mono');
      setLogoPreset('tech');
      setCompanyName('SentryCloud Platforms');
      setCompanyAddress('Level 44, Salesforce Tower, New York, NY 10001');
      setCompanyTaxLabel('EIN');
      setCompanyTaxValue('98-7654321');
      setColQtyLabel('Licenses');
      setColRateLabel('Price/Mo');
      setTaxLabel('Service Tax');
      setTaxPercent(0);
      setDiscountEnabled(true);
      setDiscountType('total');
      setTotalDiscountPercent(15);
      setLineItems([
        { id: 's-1', sku: 'SNT-ENT', description: 'Enterprise Security Suite (Annual Subscription)', quantity: 150, unitPrice: 24 },
        { id: 's-2', sku: 'SNT-SUP', description: '24/7 Dedicated Developer Support Tier', quantity: 1, unitPrice: 950 }
      ]);
      setPaymentTerms('Net 30');
    } else if (presetType === 'contractor') {
      setBrandColor('#d97706');
      setTypography('serif');
      setLogoPreset('trade');
      setCompanyName('Oakwood Timber & Joinery');
      setCompanyAddress('77 Mill Lane, Portland, OR 97201');
      setCompanyTaxLabel('License No');
      setCompanyTaxValue('LIC-99824');
      setColQtyLabel('Hours');
      setColRateLabel('Hourly Rate');
      setShowServiceDateColumn(true);
      setTaxLabel('Local Surcharge');
      setTaxPercent(5);
      setDiscountEnabled(false);
      setLineItems([
        { id: 'r-1', dateOfService: '2026-07-02', description: 'Custom Living Room Cabinet Fitting & Installation', quantity: 38, unitPrice: 85 },
        { id: 'r-2', dateOfService: '2026-07-03', description: 'Hardwood Mahogany Timber Supply (Raw Slabs)', quantity: 4, unitPrice: 650 }
      ]);
      setPaymentTerms('Net 15');
    }
  };

  // --- INLINE LINE ITEM BUILDERS ---
  const handleAddLineItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      sku: '',
      dateOfService: '',
      description: 'New Line Item Description',
      quantity: 1,
      unitPrice: 100,
      itemDiscount: 0
    };
    setLineItems([...lineItems, newItem]);
  };

  const handleUpdateItem = (id: string, field: keyof LineItem, value: any) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length <= 1) return; // Keep at least one
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  // --- DYNAMIC CALCULATIONS ---
  const calculateTotals = () => {
    let subtotal = 0;
    let totalLineDiscount = 0;

    lineItems.forEach((item) => {
      const lineTotal = item.quantity * item.unitPrice;
      subtotal += lineTotal;

      if (discountEnabled && discountType === 'line-item' && item.itemDiscount) {
        totalLineDiscount += (lineTotal * item.itemDiscount) / 100;
      }
    });

    let discountAmount = 0;
    if (discountEnabled) {
      if (discountType === 'total') {
        discountAmount = (subtotal * totalDiscountPercent) / 100;
      } else {
        discountAmount = totalLineDiscount;
      }
    }

    const subtotalAfterDiscount = subtotal - discountAmount;
    const taxAmount = (subtotalAfterDiscount * taxPercent) / 100;
    const originalTotal = subtotalAfterDiscount + taxAmount;

    // Credit Note restocking calculations
    const restockFeeAmount = docType === 'credit' ? (subtotal * restockingFeePercent) / 100 : 0;
    const finalTotal = docType === 'credit' ? -(originalTotal - restockFeeAmount) : originalTotal;

    // Proforma Deposit
    const proformaDepositAmount = (finalTotal * advanceRequirementPercent) / 100;
    const proformaRemainingBalance = finalTotal - proformaDepositAmount;

    // Receipt remaining balance
    const receiptBalanceDue = finalTotal - amountReceived;

    return {
      subtotal,
      discountAmount,
      subtotalAfterDiscount,
      taxAmount,
      originalTotal,
      restockFeeAmount,
      finalTotal,
      proformaDepositAmount,
      proformaRemainingBalance,
      receiptBalanceDue,
    };
  };

  const calc = calculateTotals();

  // Payslip Specific calculations
  const totalEarnings = earnings.reduce((sum, item) => sum + item.amount, 0);
  const totalDeductions = deductions.reduce((sum, item) => sum + item.amount, 0);
  const netSalary = Math.max(0, totalEarnings - totalDeductions);
  const autoSalaryInWords = numberToWords(netSalary);

  // Reset functionality
  const handleReset = () => {
    if (confirm('Are you sure you want to reset all customizations to corporate default?')) {
      setDocType('invoice');
      setBrandColor('#4f46e5');
      setTypography('sans');
      setLogoPreset('creative');
      setUploadedLogo(null);
      setCompanyName('Creative Studio Inc.');
      setCompanyAddress('123 Design Avenue, San Francisco, CA 94103');
      setCompanyPhone('+1 (555) 019-2834');
      setCompanyEmail('billing@creativestudio.design');
      setCompanyTaxLabel('VAT ID');
      setCompanyTaxValue('GB987654321');
      setClientName('Acme Corporation');
      setClientAddress('450 Enterprise Way, Mountain View, CA 94043');
      setInvoicePrefix('INV-');
      setInvoiceNumber('2026-1001');
      setIssueDate('2026-07-07');
      setDueDate('2026-07-22');
      setPaymentTerms('Net 15');
      setColQtyLabel('Qty');
      setColRateLabel('Rate');
      setShowSkuColumn(false);
      setShowServiceDateColumn(false);
      setTaxLabel('VAT');
      setTaxPercent(20);
      setDiscountEnabled(false);
      setDiscountType('total');
      setTotalDiscountPercent(10);
      setLineItems([
        { id: 'item-1', description: 'Brand Strategy & Identity Design', quantity: 1, unitPrice: 4500 },
        { id: 'item-2', description: 'Website Development (6 Pages)', quantity: 1, unitPrice: 8200 },
        { id: 'item-3', description: 'Stock Assets & Licensing', quantity: 1, unitPrice: 350 }
      ]);
      setEmployeeName('Sarah Connor');
      setEmployeeId('EMP-2026-0042');
      setEmployeeRole('Lead Senior Architect');
      setEmployeeDept('Engineering & AI Systems');
      setPayPeriod('July 2026');
      setEmployeeBank('JPMorgan Chase Bank');
      setEmployeeAccount('XXXX-XXXX-8821');
      setEmployeeTaxId('PAN-AAACT9827F');
      setEarnings([
        { id: 'earn-1', name: 'Basic Salary', amount: 6500 },
        { id: 'earn-2', name: 'House Rent Allowance (HRA)', amount: 2000 },
        { id: 'earn-3', name: 'Special Allowance', amount: 1200 },
        { id: 'earn-4', name: 'Performance Bonus', amount: 800 },
        { id: 'earn-5', name: 'Medical Reimbursement', amount: 250 },
      ]);
      setDeductions([
        { id: 'ded-1', name: 'Provident Fund (PF)', amount: 780 },
        { id: 'ded-2', name: 'Professional Tax', amount: 200 },
        { id: 'ded-3', name: 'TDS / Income Tax', amount: 950 },
        { id: 'ded-4', name: 'Health Insurance Premium', amount: 150 },
      ]);
    }
  };

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Download high-fidelity PDF directly
  const handleDownloadPDF = async () => {
    const element = document.getElementById('print-invoice-sheet');
    if (!element) return;

    try {
      setIsGeneratingPDF(true);

      // Temporary class to flatten styles and hide editing overlays
      element.classList.add('is-exporting-pdf');

      // Wait for DOM and styling recalculations
      await new Promise((resolve) => setTimeout(resolve, 200));

      const dataUrl = await toPng(element, {
        quality: 0.98,
        pixelRatio: 2.5, // Crisp high-res rendering
        backgroundColor: '#ffffff',
        style: {
          transform: 'none',
          boxShadow: 'none',
        },
      });

      // Remove export styles
      element.classList.remove('is-exporting-pdf');

      // Load image to compute proportional height perfectly
      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = 210; // A4 standard width in mm
      const pdfHeight = 297; // A4 standard height in mm
      
      const imgWidth = pdfWidth;
      const imgHeight = (img.height * imgWidth) / img.width;
      
      let heightLeft = imgHeight;
      let position = 0;

      // Render the image into PDF pages (handling multi-page documents seamlessly)
      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }

      // Generate context-aware file names based on doc type and unique details
      let filename = 'document.pdf';
      const docCode = `${invoicePrefix || ''}${invoiceNumber || 'Draft'}`;
      if (docType === 'invoice') {
        filename = `Invoice_${docCode}.pdf`;
      } else if (docType === 'estimate') {
        filename = `${estimateTerminology}_${docCode}.pdf`;
      } else if (docType === 'payslip') {
        filename = `Payslip_${employeeName.replace(/\s+/g, '_')}_${payPeriod.replace(/\s+/g, '_')}.pdf`;
      } else if (docType === 'receipt') {
        filename = `Receipt_${docCode}.pdf`;
      } else if (docType === 'delivery') {
        filename = `DeliveryNote_${docCode}.pdf`;
      } else if (docType === 'proforma') {
        filename = `Proforma_${docCode}.pdf`;
      } else if (docType === 'credit') {
        filename = `CreditNote_${docCode}.pdf`;
      }

      pdf.save(filename);
    } catch (error) {
      console.error('Failed to generate and download PDF:', error);
      // Fallback option in case of unexpected library failures
      window.print();
    } finally {
      setIsGeneratingPDF(false);
      element.classList.remove('is-exporting-pdf');
    }
  };

  // Trigger browser printing of the invoice sheet only
  const handlePrint = () => {
    window.print();
  };

  // Logo uploader
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedLogo(reader.result as string);
        setLogoPreset('');
      };
      reader.readAsDataURL(file);
    }
  };

  // Format currency helper to INR (Indian Rupees)
  const fmt = (num: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(num);
  };

  // Handle dynamic font styles
  const fontClass = () => {
    if (typography === 'serif') return 'font-serif';
    if (typography === 'mono') return 'font-mono';
    return 'font-sans';
  };

  return (
    <div id="invoice-workspace" className="flex h-screen w-full bg-slate-100 overflow-hidden text-slate-800">
      {/* Dynamic style injection for print stylesheet and branding colors */}
      <style>{`
        @media print {
          @page {
            margin: 15mm !important;
          }
          body, html, #root {
            background: white !important;
            color: black !important;
            overflow: visible !important;
            height: auto !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #invoice-workspace {
            background: white !important;
            height: auto !important;
            overflow: visible !important;
          }
          aside, header, nav, .no-print, button, .action-pill, .delete-row-btn {
            display: none !important;
          }
          .invoice-page-container {
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            overflow: visible !important;
            display: block !important;
          }
          .invoice-page {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: unset !important;
            display: block !important;
            background: white !important;
          }
          .interactive-border {
            border-color: transparent !important;
          }
          /* Flatten all inputs, textareas, and select menus for print */
          .invoice-page input, .invoice-page textarea, .invoice-page select {
            border: none !important;
            background: transparent !important;
            padding: 0 !important;
            margin: 0 !important;
            outline: none !important;
            box-shadow: none !important;
            resize: none !important;
            color: black !important;
            font-size: inherit !important;
            font-weight: inherit !important;
            line-height: inherit !important;
            width: 100% !important;
            height: auto !important;
            min-height: unset !important;
            overflow: visible !important;
            appearance: none !important;
            -webkit-appearance: none !important;
          }
          /* Prevent page split breaks inside critical blocks */
          .invoice-page tr, 
          .invoice-page .avoid-break {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* LEFT SIDEBAR PANEL: CONTROL HUB */}
      <aside className="w-80 flex flex-col shrink-0 bg-white border-r border-slate-200 h-full overflow-hidden no-print">
        {/* Workspace Title Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="p-1 rounded bg-indigo-50 text-indigo-600">
                <FileText className="w-5 h-5" />
              </span>
              Invoice Studio
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Customize your billing engine</p>
          </div>
          <div className="action-pill px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold rounded-full animate-pulse flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Real-time
          </div>
        </div>

        {/* Quick Industry Presets */}
        <div className="px-5 pt-4 pb-2 border-b border-slate-100 bg-slate-50">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
            Industry Quick Presets
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => applyPreset('creative')}
              className="px-2 py-1.5 bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 rounded text-[11px] font-semibold text-slate-700 transition flex items-center gap-1"
            >
              🎨 Creative
            </button>
            <button
              onClick={() => applyPreset('ecommerce')}
              className="px-2 py-1.5 bg-white border border-slate-200 hover:border-rose-500 hover:bg-rose-50 rounded text-[11px] font-semibold text-slate-700 transition flex items-center gap-1"
            >
              🛒 Retail E-com
            </button>
            <button
              onClick={() => applyPreset('saas')}
              className="px-2 py-1.5 bg-white border border-slate-200 hover:border-slate-800 hover:bg-slate-100 rounded text-[11px] font-semibold text-slate-700 transition flex items-center gap-1"
            >
              💻 SaaS Platform
            </button>
            <button
              onClick={() => applyPreset('contractor')}
              className="px-2 py-1.5 bg-white border border-slate-200 hover:border-amber-500 hover:bg-amber-50 rounded text-[11px] font-semibold text-slate-700 transition flex items-center gap-1"
            >
              🪵 Trade / Crafts
            </button>
          </div>
        </div>

        {/* Configuration Tabs Navigation */}
        <nav className="flex border-b border-slate-100 bg-white">
          <button
            onClick={() => setActiveTab('branding')}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition ${
              activeTab === 'branding'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            Branding
          </button>
          <button
            onClick={() => setActiveTab('grid')}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition ${
              activeTab === 'grid'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            Grid & Tax
          </button>
          <button
            onClick={() => setActiveTab('footer')}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition ${
              activeTab === 'footer'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            Terms
          </button>
          <button
            onClick={() => setActiveTab('ecosystem')}
            className={`flex-1 py-3 text-xs font-semibold text-center border-b-2 transition ${
              activeTab === 'ecosystem'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            Doc Tools
          </button>
        </nav>

        {/* Interactive Settings Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: BRANDING & THEME */}
          {activeTab === 'branding' && (
            <div className="space-y-5">
              {/* Logo Select */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Company Branding Logo
                </label>
                {/* File Uploader */}
                <div className="mt-1 flex items-center gap-3">
                  <div className="relative group shrink-0">
                    {uploadedLogo ? (
                      <img
                        src={uploadedLogo}
                        alt="Logo Preview"
                        className="w-12 h-12 object-contain border border-slate-200 rounded p-1 bg-white"
                      />
                    ) : (
                      <div className="w-12 h-12 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded flex items-center justify-center bg-slate-50 transition text-slate-400">
                        +
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-slate-700">Upload custom logo</p>
                    <p className="text-[10px] text-slate-400">Square PNG or JPG (Max 1MB)</p>
                  </div>
                </div>

                {/* Built-in Preset Logo Badges */}
                <div className="mt-3">
                  <p className="text-[10px] font-semibold text-slate-500 mb-1.5">Or use a professional template symbol:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {LOGO_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setLogoPreset(p.id);
                          setUploadedLogo(null);
                        }}
                        className={`px-2 py-1 text-[11px] rounded border transition flex items-center gap-1 ${
                          logoPreset === p.id && !uploadedLogo
                            ? 'border-indigo-600 bg-indigo-50 font-medium text-indigo-700'
                            : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <span className={`w-4 h-4 rounded-sm flex items-center justify-center text-[9px] ${p.bg} ${p.text}`}>
                          {p.icon}
                        </span>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Accent Color Palette */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Brand Accent Theme Color
                </label>
                <div className="flex items-center gap-2 mt-1.5">
                  {COLOR_PALETTES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setBrandColor(c.hex)}
                      style={{ backgroundColor: c.hex }}
                      className={`w-7 h-7 rounded-full border border-black/10 transition relative ${
                        brandColor.toLowerCase() === c.hex.toLowerCase()
                          ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110'
                          : 'hover:scale-105'
                      }`}
                      title={c.name}
                    />
                  ))}
                  {/* Hex input */}
                  <div className="relative flex items-center border border-slate-200 rounded-md p-1 bg-white ml-2">
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-5 h-5 border-0 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-14 text-[10px] font-mono border-0 text-center uppercase p-0 focus:ring-0 ml-1"
                    />
                  </div>
                </div>
              </div>

              {/* Typography */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Typography Pairing
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['sans', 'serif', 'mono'] as const).map((font) => (
                    <button
                      key={font}
                      onClick={() => setTypography(font)}
                      className={`py-1.5 px-2 border text-xs rounded text-center capitalize transition ${
                        typography === font
                          ? 'border-indigo-600 bg-indigo-50/50 font-bold text-indigo-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {font === 'sans' && 'Inter Sans'}
                      {font === 'serif' && 'Merriweather'}
                      {font === 'mono' && 'JetBrains'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout adjustments */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Layout Density
                </label>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-xs text-slate-600">Compact list padding</span>
                  <input
                    type="checkbox"
                    checked={compactRows}
                    onChange={(e) => setCompactRows(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300"
                  />
                </div>
              </div>

              {/* Company Profile Details */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Sender Business Details
                </label>
                <div>
                  <label className="text-[10px] text-slate-500">Business Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500">Full Postal Address</label>
                  <textarea
                    rows={2}
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500">Phone</label>
                    <input
                      type="text"
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Email</label>
                    <input
                      type="email"
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                  <div>
                    <label className="text-[9px] text-slate-500 block">Tax Registration Label</label>
                    <input
                      type="text"
                      value={companyTaxLabel}
                      placeholder="VAT ID, GSTIN, EIN"
                      onChange={(e) => setCompanyTaxLabel(e.target.value)}
                      className="w-full text-[11px] p-1 bg-white border border-slate-200 rounded mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500 block">Registration Code</label>
                    <input
                      type="text"
                      value={companyTaxValue}
                      placeholder="e.g. GB12345"
                      onChange={(e) => setCompanyTaxValue(e.target.value)}
                      className="w-full text-[11px] p-1 bg-white border border-slate-200 rounded mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GRID CUSTOMIZATION & TAXES */}
          {activeTab === 'grid' && (
            <div className="space-y-5">
              {/* Column Settings */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                  Interactive Columns Builder
                </label>

                {/* SKU column */}
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-700">Display SKU Column</span>
                    <span className="text-[10px] text-slate-400">Add inventory identifier</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showSkuColumn}
                    onChange={(e) => setShowSkuColumn(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300"
                  />
                </div>

                {/* Date of Service column */}
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-700">Date of Service</span>
                    <span className="text-[10px] text-slate-400">Per-item service timestamp</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={showServiceDateColumn}
                    onChange={(e) => setShowServiceDateColumn(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300"
                  />
                </div>

                {/* Column Rename Tweaks */}
                <div className="mt-3 space-y-2 bg-slate-50 p-3 rounded border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                    Rename Headers to Fit Industry
                  </p>
                  <div>
                    <label className="text-[9px] text-slate-500">Change 'Quantity' to:</label>
                    <input
                      type="text"
                      value={colQtyLabel}
                      onChange={(e) => setColQtyLabel(e.target.value)}
                      placeholder="Hours, Units, Qty..."
                      className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-500">Change 'Unit Price' to:</label>
                    <input
                      type="text"
                      value={colRateLabel}
                      onChange={(e) => setColRateLabel(e.target.value)}
                      placeholder="Hourly Rate, Unit Price, Fee..."
                      className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded mt-0.5"
                    />
                  </div>
                </div>
              </div>

              {/* Tax Settings */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                  Tax Structure
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500">Tax Type Label</label>
                    <input
                      type="text"
                      value={taxLabel}
                      onChange={(e) => setTaxLabel(e.target.value)}
                      placeholder="VAT, GST, Sales Tax..."
                      className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Tax Rate Percentage (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={taxPercent}
                      onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Discount settings */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Discount Settings
                  </label>
                  <input
                    type="checkbox"
                    checked={discountEnabled}
                    onChange={(e) => setDiscountEnabled(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300"
                  />
                </div>

                {discountEnabled && (
                  <div className="space-y-3 bg-slate-50 p-3 rounded border border-slate-200 mt-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Discount Application Method</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => setDiscountType('total')}
                          className={`py-1 px-1.5 border text-[11px] rounded text-center transition ${
                            discountType === 'total'
                              ? 'border-indigo-600 bg-indigo-100 text-indigo-700 font-bold'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          Whole Invoice
                        </button>
                        <button
                          onClick={() => setDiscountType('line-item')}
                          className={`py-1 px-1.5 border text-[11px] rounded text-center transition ${
                            discountType === 'line-item'
                              ? 'border-indigo-600 bg-indigo-100 text-indigo-700 font-bold'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          Per Line Item
                        </button>
                      </div>
                    </div>

                    {discountType === 'total' && (
                      <div>
                        <label className="text-[10px] text-slate-500 block">Total Discount Percentage (%)</label>
                        <input
                          type="number"
                          value={totalDiscountPercent}
                          onChange={(e) => setTotalDiscountPercent(parseFloat(e.target.value) || 0)}
                          className="w-full text-xs p-1.5 bg-white border border-slate-200 rounded mt-1"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MECHANICS, NUMBERS & FOOTER */}
          {activeTab === 'footer' && (
            <div className="space-y-5">
              {/* Document Numbering */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                  Document Numbering
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500">Custom Prefix</label>
                    <input
                      type="text"
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value)}
                      placeholder="INV-"
                      className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Starting Number</label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="1001"
                      className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Dates & Terms */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                  Invoice Deadlines
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500">Issue Date</label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="mt-3">
                  <label className="text-[10px] text-slate-500">Standard Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white focus:outline-none"
                  >
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Net 15">Net 15 (15 Days)</option>
                    <option value="Net 30">Net 30 (30 Days)</option>
                    <option value="Net 60">Net 60 (60 Days)</option>
                  </select>
                </div>
              </div>

              {/* Payment Instructions */}
              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Bank Details Section Heading
                  </label>
                  <input
                    type="text"
                    value={paymentInstructionsHeading}
                    onChange={(e) => setPaymentInstructionsHeading(e.target.value)}
                    placeholder="e.g. Bank Details, How to Pay, Wire Transfer info"
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Bank Details / Payment Instructions
                  </label>
                  <textarea
                    rows={3}
                    value={paymentInstructions}
                    onChange={(e) => setPaymentInstructions(e.target.value)}
                    placeholder="Specify Bank name, Routing, Account Number, IBAN or online payment link..."
                    className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* The Fine Print */}
              <div className="pt-2 border-t border-slate-100">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  The Fine Print (Legal Disclaimer)
                </label>
                <textarea
                  rows={2}
                  value={finePrint}
                  onChange={(e) => setFinePrint(e.target.value)}
                  placeholder="Legal disclaimers, late fee policies, return terms..."
                  className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 4: EXTENDED ECOSYSTEM CONTROLS */}
          {activeTab === 'ecosystem' && (
            <div className="space-y-5">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                  <span className="p-1 rounded bg-indigo-100 text-indigo-700 font-bold text-[9px]">ACTIVE</span>
                  Ecosystem Context Tools
                </h3>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  These customization blocks update dynamically based on the specific document type you select in the top bar.
                </p>
              </div>

              {/* 1. Estimate Customization Options */}
              {docType === 'estimate' && (
                <div className="space-y-4 border-l-2 border-indigo-500 pl-3">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <FileSignature className="w-4 h-4 text-indigo-600" />
                    Estimate Settings
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500">Estimate Terminology</label>
                    <div className="grid grid-cols-3 gap-1 mt-1">
                      {(['Estimate', 'Quote', 'Proposal'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setEstimateTerminology(t)}
                          className={`py-1 px-1 border text-[10px] rounded text-center font-medium capitalize transition ${
                            estimateTerminology === t
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500">Validity Expiration Frame</label>
                    <select
                      value={validityDays}
                      onChange={(e) => setValidityDays(parseInt(e.target.value) || 30)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded mt-1 bg-white"
                    >
                      <option value="14">14 Days</option>
                      <option value="30">30 Days</option>
                      <option value="60">60 Days</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500">Pre-sale Terms & Conditions</label>
                    <textarea
                      rows={2}
                      value={preSaleTerms}
                      onChange={(e) => setPreSaleTerms(e.target.value)}
                      className="w-full text-[11px] p-1.5 bg-white border border-slate-200 rounded mt-1"
                    />
                  </div>

                  <div className="bg-white p-2.5 border border-slate-200 rounded space-y-2">
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">
                      Digital Acceptance Demo
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-slate-600">Mark approved/signed</span>
                      <input
                        type="checkbox"
                        checked={estimateSigned}
                        onChange={(e) => setEstimateSigned(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300"
                      />
                    </div>
                    {estimateSigned && (
                      <div className="space-y-1 pt-1.5 border-t border-slate-100">
                        <label className="text-[9px] text-slate-500 block">Signee Print Name</label>
                        <input
                          type="text"
                          value={signerName}
                          onChange={(e) => setSignerName(e.target.value)}
                          className="w-full text-[10px] p-1 bg-slate-50 border border-slate-200 rounded"
                        />
                        <label className="text-[9px] text-slate-500 block">Signee Signature Ink</label>
                        <input
                          type="text"
                          value={signerSignature}
                          onChange={(e) => setSignerSignature(e.target.value)}
                          className="w-full text-[10px] p-1 font-signature bg-slate-50 border border-slate-200 rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. Proforma Settings */}
              {docType === 'proforma' && (
                <div className="space-y-4 border-l-2 border-indigo-500 pl-3">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    Proforma Settings
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500">Upfront Advance Deposit Required (%)</label>
                    <input
                      type="number"
                      value={advanceRequirementPercent}
                      onChange={(e) => setAdvanceRequirementPercent(parseInt(e.target.value) || 0)}
                      className="w-full text-xs p-2 border border-slate-200 rounded mt-1 bg-white"
                      max="100"
                      min="0"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      The proforma highlights this upfront deposit amount on the final calculations grid.
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-200">
                    <button
                      onClick={() => {
                        setProformaConverted(true);
                        setDocType('invoice');
                        alert('Success! Proforma converted to a Standard Tax Invoice.');
                      }}
                      className="w-full py-2 bg-indigo-600 text-white rounded text-xs font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Convert to Tax Invoice Now
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Delivery Notes Packing Slip Settings */}
              {docType === 'delivery' && (
                <div className="space-y-4 border-l-2 border-indigo-500 pl-3">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <Truck className="w-4 h-4 text-indigo-600" />
                    Delivery Logistics
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500">Courier / Shipper Name</label>
                    <input
                      type="text"
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded mt-1 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500">Tracking Number</label>
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded mt-1 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500">Dispatch Reference Number</label>
                    <input
                      type="text"
                      value={dispatchNumber}
                      onChange={(e) => setDispatchNumber(e.target.value)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded mt-1 bg-white"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                        Dimensions & Weights
                      </label>
                      <input
                        type="checkbox"
                        checked={showBoxMetrics}
                        onChange={(e) => setShowBoxMetrics(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300"
                      />
                    </div>

                    {showBoxMetrics && (
                      <div className="space-y-2 bg-slate-50 p-2.5 rounded border border-slate-200">
                        <div>
                          <label className="text-[9px] text-slate-500">Total Weight</label>
                          <input
                            type="text"
                            value={cargoWeight}
                            onChange={(e) => setCargoWeight(e.target.value)}
                            className="w-full text-[11px] p-1 bg-white border border-slate-200 rounded mt-0.5"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500">Package Dimensions</label>
                          <input
                            type="text"
                            value={cargoDimensions}
                            onChange={(e) => setCargoDimensions(e.target.value)}
                            className="w-full text-[11px] p-1 bg-white border border-slate-200 rounded mt-0.5"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-slate-500">Number of Cartons</label>
                          <input
                            type="number"
                            value={cargoBoxes}
                            onChange={(e) => setCargoBoxes(parseInt(e.target.value) || 1)}
                            className="w-full text-[11px] p-1 bg-white border border-slate-200 rounded mt-0.5"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Payment Receipt Settings */}
              {docType === 'receipt' && (
                <div className="space-y-4 border-l-2 border-indigo-500 pl-3">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                    Receipt Verification
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500">Amount Received (₹)</label>
                    <input
                      type="number"
                      value={amountReceived}
                      onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded mt-1 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500">Payment Gateway / Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as any)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded mt-1 bg-white"
                    >
                      <option value="Wire">Bank Wire</option>
                      <option value="Cash">Cash</option>
                      <option value="Stripe">Stripe / Online</option>
                      <option value="Cheque">Bank Cheque</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500">Gratitude / Stamp Message</label>
                    <textarea
                      rows={2}
                      value={receiptThankYouMessage}
                      onChange={(e) => setReceiptThankYouMessage(e.target.value)}
                      className="w-full text-[11px] p-1.5 bg-white border border-slate-200 rounded mt-1"
                    />
                  </div>
                </div>
              )}

              {/* 5. Credit Note Settings */}
              {docType === 'credit' && (
                <div className="space-y-4 border-l-2 border-indigo-500 pl-3">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                    <Undo2 className="w-4 h-4 text-indigo-600" />
                    Credit adjustments
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500">Mandatory Reason for Credit</label>
                    <textarea
                      rows={2}
                      value={reasonForCredit}
                      onChange={(e) => setReasonForCredit(e.target.value)}
                      placeholder="e.g. Overcharged hours on lines item"
                      className="w-full text-xs p-1.5 border border-slate-200 rounded mt-1 bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500">Restocking Penalty Fee (%)</label>
                    <input
                      type="number"
                      value={restockingFeePercent}
                      onChange={(e) => setRestockingFeePercent(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-1.5 border border-slate-200 rounded mt-1 bg-white"
                      placeholder="0"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                      Subtracted from credit refund total.
                    </p>
                  </div>

                  <div className="bg-white p-2.5 border border-slate-200 rounded space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-700 uppercase">Manager Signoff</span>
                      <input
                        type="checkbox"
                        checked={managerApproved}
                        onChange={(e) => setManagerApproved(e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 border-slate-300"
                      />
                    </div>
                    {managerApproved && (
                      <div>
                        <label className="text-[9px] text-slate-500">Signoff Approver</label>
                        <input
                          type="text"
                          value={managerName}
                          onChange={(e) => setManagerName(e.target.value)}
                          className="w-full text-[10px] p-1 border border-slate-200 rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 6. Payslip Customization Settings */}
              {docType === 'payslip' && (
                <div className="space-y-4 border-l-2 border-indigo-500 pl-3">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-indigo-600" />
                    Employee Profile
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-500">Employee Name</label>
                      <input
                        type="text"
                        value={employeeName}
                        onChange={(e) => setEmployeeName(e.target.value)}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500">Employee ID</label>
                      <input
                        type="text"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded mt-1 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-500">Role / Title</label>
                      <input
                        type="text"
                        value={employeeRole}
                        onChange={(e) => setEmployeeRole(e.target.value)}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500">Department</label>
                      <input
                        type="text"
                        value={employeeDept}
                        onChange={(e) => setEmployeeDept(e.target.value)}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded mt-1 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-500">Pay Period</label>
                      <input
                        type="text"
                        value={payPeriod}
                        onChange={(e) => setPayPeriod(e.target.value)}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500">Tax ID / PAN</label>
                      <input
                        type="text"
                        value={employeeTaxId}
                        onChange={(e) => setEmployeeTaxId(e.target.value)}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded mt-1 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-500">Bank Name</label>
                      <input
                        type="text"
                        value={employeeBank}
                        onChange={(e) => setEmployeeBank(e.target.value)}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded mt-1 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500">Bank Account No</label>
                      <input
                        type="text"
                        value={employeeAccount}
                        onChange={(e) => setEmployeeAccount(e.target.value)}
                        className="w-full text-xs p-1.5 border border-slate-200 rounded mt-1 bg-white"
                      />
                    </div>
                  </div>

                  {/* Dynamic Earnings Editor */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Earnings Breakdowns</span>
                      <button
                        onClick={() => {
                          const id = `earn-${Date.now()}`;
                          setEarnings([...earnings, { id, name: 'Allowance', amount: 100 }]);
                        }}
                        className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {earnings.map((earn) => (
                        <div key={earn.id} className="flex gap-1 items-center">
                          <input
                            type="text"
                            value={earn.name}
                            onChange={(e) => {
                              setEarnings(earnings.map(x => x.id === earn.id ? { ...x, name: e.target.value } : x));
                            }}
                            className="text-[11px] p-1 border border-slate-200 rounded bg-white flex-1 min-w-0"
                            placeholder="Name"
                          />
                          <div className="relative w-20 shrink-0">
                            <span className="absolute left-1 top-1.5 text-[9px] text-slate-400">₹</span>
                            <input
                              type="number"
                              value={earn.amount}
                              onChange={(e) => {
                                setEarnings(earnings.map(x => x.id === earn.id ? { ...x, amount: parseFloat(e.target.value) || 0 } : x));
                              }}
                              className="text-[11px] p-1 pl-3.5 border border-slate-200 rounded bg-white text-right w-full"
                            />
                          </div>
                          <button
                            onClick={() => setEarnings(earnings.filter(x => x.id !== earn.id))}
                            disabled={earnings.length <= 1}
                            className="text-slate-300 hover:text-rose-600 transition disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Deductions Editor */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Deductions Breakdowns</span>
                      <button
                        onClick={() => {
                          const id = `ded-${Date.now()}`;
                          setDeductions([...deductions, { id, name: 'Tax Deduction', amount: 50 }]);
                        }}
                        className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {deductions.map((ded) => (
                        <div key={ded.id} className="flex gap-1 items-center">
                          <input
                            type="text"
                            value={ded.name}
                            onChange={(e) => {
                              setDeductions(deductions.map(x => x.id === ded.id ? { ...x, name: e.target.value } : x));
                            }}
                            className="text-[11px] p-1 border border-slate-200 rounded bg-white flex-1 min-w-0"
                            placeholder="Name"
                          />
                          <div className="relative w-20 shrink-0">
                            <span className="absolute left-1 top-1.5 text-[9px] text-slate-400">₹</span>
                            <input
                              type="number"
                              value={ded.amount}
                              onChange={(e) => {
                                setDeductions(deductions.map(x => x.id === ded.id ? { ...x, amount: parseFloat(e.target.value) || 0 } : x));
                              }}
                              className="text-[11px] p-1 pl-3.5 border border-slate-200 rounded bg-white text-right w-full"
                            />
                          </div>
                          <button
                            onClick={() => setDeductions(deductions.filter(x => x.id !== ded.id))}
                            disabled={deductions.length <= 1}
                            className="text-slate-300 hover:text-rose-600 transition disabled:opacity-30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* No specific tools loaded state */}
              {docType === 'invoice' && (
                <div className="p-4 bg-slate-50 rounded border border-dashed border-slate-300 text-center">
                  <Sliders className="w-5 h-5 mx-auto text-slate-400 mb-1" />
                  <span className="text-[11px] font-semibold text-slate-600">Standard Tax Invoice Mode</span>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Standard VAT math, payment instructions, and terms are fully configured under the first three tabs.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Studio Footer Controls */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 no-print space-y-2">
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            style={{ backgroundColor: brandColor }}
            className="w-full text-white py-2.5 px-4 rounded-lg font-bold text-xs shadow hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingPDF ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download PDF
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-2 px-4 rounded-lg font-bold text-xs transition flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print via Browser
          </button>
        </div>
      </aside>

      {/* RIGHT PREVIEW CANVAS AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOP CONTROL BAR */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 no-print">
          {/* Sub-document Ecosystem Selection Toggles */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setDocType('invoice')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                docType === 'invoice'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              Invoice
            </button>

            <button
              onClick={() => setDocType('estimate')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                docType === 'estimate'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <FileSignature className="w-3.5 h-3.5 text-blue-600" />
              {estimateTerminology}
            </button>

            <button
              onClick={() => setDocType('proforma')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                docType === 'proforma'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              Proforma
            </button>

            <button
              onClick={() => setDocType('delivery')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                docType === 'delivery'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-rose-600" />
              Delivery Note
            </button>

            <button
              onClick={() => setDocType('receipt')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                docType === 'receipt'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              Receipt
            </button>

            <button
              onClick={() => setDocType('credit')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                docType === 'credit'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5 text-amber-600" />
              Credit Note
            </button>

            <button
              onClick={() => {
                setDocType('payslip');
                setActiveTab('ecosystem');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                docType === 'payslip'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-violet-600" />
              Salary Slip
            </button>
          </div>

          {/* Quick utility controls */}
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-400 flex items-center gap-1 font-medium bg-slate-50 px-2 py-1 rounded border border-slate-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Auto-saved locally
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-md border border-slate-200 flex items-center gap-1 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </button>
          </div>
        </header>

        {/* PREVIEW CONTAINER */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 flex justify-center items-start bg-slate-100 invoice-page-container">
          {/* THE WORK OF ART SHEET */}
          <div
            id="print-invoice-sheet"
            className={`invoice-page w-full max-w-[800px] min-h-[1050px] bg-white border border-slate-200 shadow-2xl rounded-sm p-10 md:p-14 flex flex-col justify-between transition-all duration-300 relative ${fontClass()}`}
          >
            {/* Rubber Acceptance Stamp overlays */}
            {docType === 'estimate' && estimateSigned && (
              <div className="absolute right-12 top-48 border-4 border-emerald-600 text-emerald-600 font-extrabold rounded-md px-4 py-2 text-sm uppercase tracking-widest rotate-12 bg-white/90 shadow-md flex flex-col items-center z-10 select-none">
                <span className="text-[10px] font-bold tracking-tight">Approved & Signed</span>
                <span className="text-xs border-t border-emerald-500 mt-1 pt-0.5">{signerName}</span>
                <span className="text-[9px] font-normal lowercase">{issueDate}</span>
              </div>
            )}

            {docType === 'receipt' && calc.receiptBalanceDue <= 0 && (
              <div className="absolute right-12 top-48 border-4 border-blue-600 text-blue-600 font-extrabold rounded-md px-6 py-2 text-base uppercase tracking-widest -rotate-12 bg-white/90 shadow-md flex flex-col items-center z-10 select-none">
                <span className="text-lg tracking-wider">PAID IN FULL</span>
                <span className="text-[10px] font-bold tracking-tight mt-0.5">{paymentMethod} - {paymentDate}</span>
              </div>
            )}

            {docType === 'credit' && managerApproved && (
              <div className="absolute right-12 top-48 border-4 border-rose-600 text-rose-600 font-extrabold rounded-md px-4 py-1.5 text-xs uppercase tracking-wider rotate-6 bg-white/90 shadow-md flex flex-col items-center z-10 select-none">
                <span className="font-bold tracking-tight">Authorized Adjustment</span>
                <span className="text-[10px] text-rose-500 font-normal">{managerName}</span>
              </div>
            )}

            {/* TOP SENDER BLOCK & LOGO */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-8">
                {/* Logo & Company identity */}
                <div className="flex items-start gap-4">
                  {/* Visual logo presentation */}
                  {uploadedLogo ? (
                    <img
                      src={uploadedLogo}
                      alt="Company Logo"
                      className="w-16 h-16 object-contain border border-slate-100 rounded bg-white p-1 shadow-sm"
                    />
                  ) : (
                    LOGO_PRESETS.map(
                      (p) =>
                        p.id === logoPreset && (
                          <div
                            key={p.id}
                            style={{ backgroundColor: brandColor }}
                            className={`w-14 h-14 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-md`}
                          >
                            {p.icon}
                          </div>
                        )
                    )
                  )}

                  {/* Company Profile metadata */}
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">{companyName}</h2>
                    <p className="text-xs text-slate-500 whitespace-pre-line leading-relaxed max-w-xs mt-1">
                      {companyAddress}
                    </p>
                    {(companyPhone || companyEmail) && (
                      <div className="flex flex-col gap-0.5 mt-2 text-[11px] text-slate-400">
                        {companyPhone && <span className="flex items-center gap-1"><Phone className="w-3 h-3 shrink-0" /> {companyPhone}</span>}
                        {companyEmail && <span className="flex items-center gap-1"><Mail className="w-3 h-3 shrink-0" /> {companyEmail}</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Sender registration and tax numbers */}
                <div className="text-right text-xs text-slate-500">
                  {/* Dynamic Doc Title */}
                  <h1
                    style={{ color: brandColor }}
                    className="text-2xl font-extrabold uppercase tracking-tight"
                  >
                    {docType === 'invoice' && 'Tax Invoice'}
                    {docType === 'estimate' && estimateTerminology}
                    {docType === 'proforma' && 'PROFORMA INVOICE'}
                    {docType === 'delivery' && 'Delivery Note'}
                    {docType === 'receipt' && 'Payment Receipt'}
                    {docType === 'credit' && 'Credit Note'}
                    {docType === 'payslip' && 'Salary Payslip'}
                  </h1>

                  {/* Doc Identifier */}
                  <div className="mt-2 text-slate-400 space-y-0.5">
                    {docType === 'payslip' ? (
                      <p className="font-semibold text-slate-700">
                        Pay Period: <span className="text-slate-900 font-bold">{payPeriod}</span>
                      </p>
                    ) : (
                      <p className="font-semibold text-slate-700">
                        Document #{invoicePrefix}
                        {invoiceNumber}
                      </p>
                    )}
                    {docType === 'delivery' && (
                      <p className="text-[11px]">
                        Courier: <span className="text-slate-600 font-medium">{courierName}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {docType === 'payslip' ? (
                <div className="my-8">
                  {/* Employee Profile grid */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Employee Name</p>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">{employeeName || 'N/A'}</p>
                      <p className="text-[10px] text-slate-500 mt-1">ID: {employeeId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Job Designation</p>
                      <p className="font-semibold text-slate-700 mt-0.5">{employeeRole || 'N/A'}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Dept: {employeeDept || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tax Registration</p>
                      <p className="font-semibold text-slate-700 mt-0.5">Tax ID: {employeeTaxId || 'N/A'}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Status: Regular Full-time</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Disbursal Bank</p>
                      <p className="font-semibold text-slate-700 mt-0.5">{employeeBank || 'N/A'}</p>
                      <p className="text-[10px] text-slate-500 mt-1">A/C: {employeeAccount || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Dual Earnings & Deductions Tables */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                    {/* Earnings side */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3 flex justify-between items-center">
                        <span>Earnings & Benefits</span>
                        <span style={{ color: brandColor }} className="text-[11px] font-semibold">In INR (₹)</span>
                      </h3>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-[10px] uppercase text-slate-400 font-bold border-b border-slate-100">
                            <th className="pb-1.5 text-left">Description</th>
                            <th className="pb-1.5 text-right w-24">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {earnings.map((earn) => (
                            <tr key={earn.id} className="border-b border-slate-100">
                              <td className="py-2 font-medium text-slate-700">{earn.name}</td>
                              <td className="py-2 text-right text-slate-900 font-semibold">{fmt(earn.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold text-slate-800">
                            <td className="py-3 text-left">Total Earnings (A)</td>
                            <td className="py-3 text-right text-sm" style={{ color: brandColor }}>{fmt(totalEarnings)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Deductions side */}
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3 flex justify-between items-center">
                        <span>Deductions & Tax withholdings</span>
                        <span className="text-rose-600 text-[11px] font-semibold">In INR (₹)</span>
                      </h3>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-[10px] uppercase text-slate-400 font-bold border-b border-slate-100">
                            <th className="pb-1.5 text-left">Description</th>
                            <th className="pb-1.5 text-right w-24">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deductions.map((ded) => (
                            <tr key={ded.id} className="border-b border-slate-100">
                              <td className="py-2 font-medium text-slate-700">{ded.name}</td>
                              <td className="py-2 text-right text-rose-600 font-medium">-{fmt(ded.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-bold text-slate-800">
                            <td className="py-3 text-left">Total Deductions (B)</td>
                            <td className="py-3 text-right text-sm text-rose-600">{fmt(totalDeductions)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Net Take-Home Salary Banner */}
                  <div className="mt-8 border-2 rounded-xl p-5 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: brandColor }}>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Take-Home Salary (A - B)</p>
                      <h4 className="text-xl font-black mt-1" style={{ color: brandColor }}>{fmt(netSalary)}</h4>
                    </div>
                    <div className="text-right sm:max-w-md">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Net Salary In Words</p>
                      <p className="text-xs font-semibold text-slate-700 mt-1 italic whitespace-normal break-words">
                        {autoSalaryInWords}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* CLIENT BILLING & DETAILS GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 my-8 text-xs leading-relaxed">
                    <div>
                      <p
                        style={{ color: brandColor }}
                        className="text-[10px] font-bold uppercase tracking-widest mb-2"
                      >
                        {docType === 'delivery' ? 'Ship To' : 'Bill To'}
                      </p>
                      {/* Inline editable block */}
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          className="font-bold text-slate-900 text-sm w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white p-0.5 rounded transition focus:outline-none"
                        />
                        <textarea
                          rows={2}
                          value={clientAddress}
                          onChange={(e) => setClientAddress(e.target.value)}
                          className="text-slate-500 w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white p-0.5 rounded transition focus:outline-none block"
                        />
                        <input
                          type="text"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="Client phone"
                          className="text-slate-400 w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white p-0.5 rounded transition text-[11px] focus:outline-none"
                        />
                        <input
                          type="text"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="Client email"
                          className="text-slate-400 w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white p-0.5 rounded transition text-[11px] focus:outline-none block"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 sm:text-right flex flex-col sm:items-end">
                      <p
                        style={{ color: brandColor }}
                        className="text-[10px] font-bold uppercase tracking-widest mb-1"
                      >
                        Document Metadata
                      </p>
                      <p className="text-slate-500">
                        Date Issued:{' '}
                        <span className="text-slate-900 font-semibold">{issueDate}</span>
                      </p>
                      {docType === 'estimate' ? (
                        <p className="text-slate-500">
                          Valid Until:{' '}
                          <span className="text-slate-900 font-semibold">
                            {new Date(new Date(issueDate).getTime() + validityDays * 24 * 60 * 60 * 1000)
                              .toISOString()
                              .split('T')[0]}
                          </span>
                        </p>
                      ) : docType === 'receipt' ? (
                        <p className="text-slate-500">
                          Payment Date:{' '}
                          <span className="text-slate-900 font-semibold">{paymentDate}</span>
                        </p>
                      ) : (
                        <p className="text-slate-500">
                          Date Due:{' '}
                          <span className="text-slate-900 font-semibold">{dueDate}</span>
                        </p>
                      )}

                      {docType !== 'delivery' && docType !== 'receipt' && (
                        <p className="text-slate-500">
                          Terms: <span className="text-slate-900 font-semibold">{paymentTerms}</span>
                        </p>
                      )}

                      {/* Delivery details */}
                      {docType === 'delivery' && (
                        <div className="text-[11px] text-slate-500 text-left sm:text-right space-y-0.5">
                          <p>
                            Tracking No:{' '}
                            <span className="text-slate-900 font-semibold">{trackingNumber}</span>
                          </p>
                          <p>
                            Dispatch Code:{' '}
                            <span className="text-slate-900 font-semibold">{dispatchNumber}</span>
                          </p>
                        </div>
                      )}

                      {/* Reference to original invoice for receipts / credit notes */}
                      {(docType === 'receipt' || docType === 'credit') && (
                        <p className="text-slate-500">
                          Reference Invoice No:{' '}
                          <span className="text-slate-900 font-semibold">
                            {invoicePrefix}
                            {invoiceNumber}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* DYNAMIC DOCUMENTS GRID / TABLE */}
                  <div className="border-t border-slate-100 pt-6">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr
                          style={{ borderBottomColor: brandColor }}
                          className="border-b-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                        >
                          {showSkuColumn && <th className="pb-3 w-16">SKU</th>}
                          {showServiceDateColumn && <th className="pb-3 w-20">Date</th>}
                          <th className="pb-3">Item & Description</th>
                          <th className="pb-3 w-16 text-center">{colQtyLabel}</th>
                          {/* Hide rates/pricing completely on delivery notes */}
                          {docType !== 'delivery' && (
                            <>
                              <th className="pb-3 w-24 text-right">{colRateLabel}</th>
                              {discountEnabled && discountType === 'line-item' && (
                                <th className="pb-3 w-14 text-center">Disc%</th>
                              )}
                              <th className="pb-3 w-24 text-right">Amount</th>
                            </>
                          )}
                          <th className="pb-3 w-8 no-print"></th>
                        </tr>
                      </thead>
                      <tbody className="text-xs text-slate-700">
                        {lineItems.map((item, index) => {
                          const lineAmount = item.quantity * item.unitPrice;
                          const hasLineDiscount = discountEnabled && discountType === 'line-item' && item.itemDiscount;
                          const calculatedLineTotal = hasLineDiscount
                            ? lineAmount - (lineAmount * (item.itemDiscount || 0)) / 100
                            : lineAmount;

                          return (
                            <tr
                              key={item.id}
                              className={`border-b border-slate-100 group transition hover:bg-slate-50/50 ${
                                compactRows ? 'py-1' : 'py-3'
                              }`}
                            >
                              {/* SKU Column */}
                              {showSkuColumn && (
                                <td className="py-2.5">
                                  <input
                                    type="text"
                                    value={item.sku || ''}
                                    onChange={(e) => handleUpdateItem(item.id, 'sku', e.target.value)}
                                    placeholder="ST-10"
                                    className="w-full text-[11px] bg-transparent border-0 focus:ring-1 focus:ring-indigo-500 rounded p-0.5 no-print"
                                  />
                                  <span className="print-only hidden print:inline">{item.sku}</span>
                                </td>
                              )}

                              {/* Date of Service Column */}
                              {showServiceDateColumn && (
                                <td className="py-2.5 text-slate-500">
                                  <input
                                    type="text"
                                    value={item.dateOfService || ''}
                                    onChange={(e) => handleUpdateItem(item.id, 'dateOfService', e.target.value)}
                                    placeholder="2026-07-01"
                                    className="w-full text-[11px] bg-transparent border-0 focus:ring-1 focus:ring-indigo-500 rounded p-0.5 no-print"
                                  />
                                  <span className="print-only hidden print:inline">{item.dateOfService}</span>
                                </td>
                              )}

                              {/* Item Description */}
                              <td className="py-2.5 pr-4">
                                <input
                                  type="text"
                                  value={item.description}
                                  onChange={(e) => handleUpdateItem(item.id, 'description', e.target.value)}
                                  className="w-full font-semibold text-slate-800 bg-transparent border-0 focus:ring-1 focus:ring-indigo-500 rounded p-0.5 no-print"
                                />
                                <span className="print-only hidden print:inline font-semibold text-slate-850">
                                  {item.description}
                                </span>
                              </td>

                              {/* Quantity */}
                              <td className="py-2.5 text-center">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => handleUpdateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                  className="w-12 text-center bg-transparent border-0 focus:ring-1 focus:ring-indigo-500 rounded p-0.5 no-print font-medium"
                                />
                                <span className="print-only hidden print:inline font-medium">{item.quantity}</span>
                              </td>

                              {/* Pricing details columns */}
                              {docType !== 'delivery' && (
                                <>
                                  {/* Unit Price Rate */}
                                  <td className="py-2.5 text-right font-medium text-slate-600">
                                    <div className="inline-flex items-center justify-end w-full no-print">
                                      <span className="text-[10px] text-slate-400 mr-0.5">₹</span>
                                      <input
                                        type="number"
                                        value={item.unitPrice}
                                        onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                        className="w-16 text-right bg-transparent border-0 focus:ring-1 focus:ring-indigo-500 rounded p-0.5"
                                      />
                                    </div>
                                    <span className="print-only hidden print:inline">
                                      {fmt(item.unitPrice)}
                                    </span>
                                  </td>

                                  {/* Per line item discount column */}
                                  {discountEnabled && discountType === 'line-item' && (
                                    <td className="py-2.5 text-center">
                                      <input
                                        type="number"
                                        value={item.itemDiscount || 0}
                                        onChange={(e) => handleUpdateItem(item.id, 'itemDiscount', parseFloat(e.target.value) || 0)}
                                        className="w-10 text-center bg-transparent border-0 focus:ring-1 focus:ring-indigo-500 rounded p-0.5 no-print text-emerald-600 font-semibold"
                                      />
                                      <span className="print-only hidden print:inline text-emerald-600 font-medium">
                                        {item.itemDiscount || 0}%
                                      </span>
                                    </td>
                                  )}

                                  {/* Net Amount Total */}
                                  <td className="py-2.5 text-right font-semibold text-slate-900">
                                    {docType === 'credit' ? '-' : ''}
                                    {fmt(calculatedLineTotal)}
                                  </td>
                                </>
                              )}

                              {/* Action Button */}
                              <td className="py-2.5 text-right no-print">
                                <button
                                  onClick={() => handleRemoveLineItem(item.id)}
                                  className="text-slate-300 hover:text-rose-600 transition p-1"
                                  title="Delete Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Inline "Add Item" handle */}
                    <div className="mt-4 no-print flex justify-start">
                      <button
                        onClick={handleAddLineItem}
                        className="px-3 py-1.5 border border-dashed border-slate-300 rounded hover:border-indigo-500 hover:bg-slate-50 transition text-xs font-bold text-slate-600 flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-indigo-500" />
                        Add Custom Line Item
                      </button>
                    </div>
                  </div>

                  {/* DYNAMIC SUMMARY TOTALS & WORKFLOW HIGHLIGHTS */}
                  {docType !== 'delivery' && (
                    <div className="flex justify-end mt-10 avoid-break">
                      <div className="w-72 space-y-2.5 text-xs text-slate-500">
                        {/* Raw Subtotal */}
                        <div className="flex justify-between items-center">
                          <p>Gross Subtotal</p>
                          <p className="font-semibold text-slate-800">{fmt(calc.subtotal)}</p>
                        </div>

                        {/* Overall Discount */}
                        {discountEnabled && (
                          <div className="flex justify-between items-center text-emerald-600 font-medium">
                            <p>
                              Discount{' '}
                              {discountType === 'total' ? `(${totalDiscountPercent}%)` : '(Line Items Total)'}
                            </p>
                            <p>
                              -{fmt(calc.discountAmount)}
                            </p>
                          </div>
                        )}

                        {/* Tax label */}
                        <div className="flex justify-between items-center">
                          <p>
                            {taxLabel} ({taxPercent}%)
                          </p>
                          <p className="font-semibold text-slate-800">{fmt(calc.taxAmount)}</p>
                        </div>

                        {/* Restocking fee deduction for Credit notes */}
                        {docType === 'credit' && restockingFeePercent > 0 && (
                          <div className="flex justify-between items-center text-rose-600 font-medium">
                            <p>Restocking Admin Fee ({restockingFeePercent}%)</p>
                            <p>+{fmt(calc.restockFeeAmount)}</p>
                          </div>
                        )}

                        {/* Grand Total Highlight Box */}
                        <div
                          style={{ borderTopColor: brandColor }}
                          className="flex justify-between items-center text-sm font-bold pt-3 border-t"
                        >
                          <span style={{ color: brandColor }}>
                            {docType === 'credit' ? 'Total Refund Due' : 'Grand Total Due'}
                          </span>
                          <span style={{ color: brandColor }} className="text-base font-black">
                            {fmt(calc.finalTotal)}
                          </span>
                        </div>

                        {/* Proforma Advance breakdown block */}
                        {docType === 'proforma' && (
                          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                            <div className="flex justify-between text-[11px] font-bold text-slate-800">
                              <span>{advanceRequirementPercent}% Advance Deposit Due:</span>
                              <span style={{ color: brandColor }}>{fmt(calc.proformaDepositAmount)}</span>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400">
                              <span>Remaining Net Balance:</span>
                              <span>{fmt(calc.proformaRemainingBalance)}</span>
                            </div>
                          </div>
                        )}

                        {/* Payment Receipt Remaining Balance */}
                        {docType === 'receipt' && (
                          <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
                            <div className="flex justify-between text-[11px] font-bold text-slate-800">
                              <span>Total Payment Logged:</span>
                              <span className="text-emerald-600">{fmt(amountReceived)}</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-bold border-t border-slate-200 pt-1.5">
                              <span>Outstanding Balance Due:</span>
                              <span className={calc.receiptBalanceDue <= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                {fmt(Math.max(0, calc.receiptBalanceDue))}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Delivery custom box metrics details block */}
                  {docType === 'delivery' && showBoxMetrics && (
                    <div className="mt-8 border-t border-slate-100 pt-6">
                      <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded border border-slate-200 text-xs">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Gross Weight</p>
                          <p className="font-semibold text-slate-800 mt-1">{cargoWeight}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Carton Dimensions</p>
                          <p className="font-semibold text-slate-800 mt-1">{cargoDimensions}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Package Count</p>
                          <p className="font-semibold text-slate-800 mt-1">{cargoBoxes} Boxes</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Estimate valid terms */}
                  {docType === 'estimate' && preSaleTerms && (
                    <div className="mt-8 p-3 bg-blue-50/50 border border-blue-100 rounded text-[11px] text-blue-800 italic">
                      <span className="font-bold uppercase tracking-wide not-italic block mb-0.5 text-[9px] text-blue-500">
                        Pre-sale Proposal Agreement Note
                      </span>
                      {preSaleTerms}
                    </div>
                  )}

                  {/* Credit reason box */}
                  {docType === 'credit' && reasonForCredit && (
                    <div className="mt-8 p-3 bg-rose-50/50 border border-rose-100 rounded text-[11px] text-rose-800">
                      <span className="font-bold uppercase tracking-wide block mb-0.5 text-[9px] text-rose-500">
                        Reason for Credit Adjustment
                      </span>
                      {reasonForCredit}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* LOWER PAYMENT INSTRUCTIONS & COMPLIANCE BLOCK */}
            <div className="mt-14 border-t border-slate-100 pt-6 avoid-break">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] leading-relaxed">
                {/* Dynamic How to Pay/Bank Details banking details */}
                <div>
                  {docType !== 'delivery' && (
                    <>
                      <div className="no-print">
                        <input
                          type="text"
                          value={paymentInstructionsHeading}
                          onChange={(e) => setPaymentInstructionsHeading(e.target.value)}
                          style={{ color: brandColor }}
                          className="text-[9px] font-bold uppercase tracking-widest bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white p-0.5 rounded transition focus:outline-none w-full mb-1.5"
                        />
                      </div>
                      <p
                        style={{ color: brandColor }}
                        className="print-only hidden print:block text-[9px] font-bold uppercase tracking-widest mb-1.5"
                      >
                        {paymentInstructionsHeading}
                      </p>
                      <p className="text-slate-500 font-medium whitespace-pre-wrap">{paymentInstructions}</p>
                    </>
                  )}
                </div>

                {/* Terms / Disclaimers / Sign-off */}
                <div className="text-slate-400 md:text-right">
                  {docType === 'delivery' ? (
                    <div className="space-y-4">
                      <p
                        style={{ color: brandColor }}
                        className="text-[9px] font-bold uppercase tracking-widest text-left md:text-right"
                      >
                        Receipt Sign-off
                      </p>
                      <div className="flex flex-col items-start md:items-end space-y-1">
                        <div className="w-48 border-b border-slate-300 h-10 no-print flex items-end">
                          <input
                            type="text"
                            value={deliveryReceivedBy}
                            placeholder="Sign name to accept cargo"
                            onChange={(e) => setDeliveryReceivedBy(e.target.value)}
                            className="w-full text-xs font-signature p-1 bg-slate-50 border-0 focus:ring-0 rounded"
                          />
                        </div>
                        <span className="print-only hidden print:inline font-signature italic text-slate-800 text-sm">
                          {deliveryReceivedBy || '...........................................'}
                        </span>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                          Authorized Receiver Name
                        </p>
                        <input
                          type="date"
                          value={deliveryReceivedDate}
                          onChange={(e) => setDeliveryReceivedDate(e.target.value)}
                          className="w-32 text-[10px] text-right bg-transparent border-0 p-0 hover:bg-slate-50 rounded no-print"
                        />
                        <span className="print-only hidden print:inline text-slate-600">
                          Date: {deliveryReceivedDate || '..../..../2026'}
                        </span>
                      </div>
                    </div>
                  ) : docType === 'estimate' ? (
                    <div className="space-y-3">
                      <p
                        style={{ color: brandColor }}
                        className="text-[9px] font-bold uppercase tracking-widest text-left md:text-right"
                      >
                        Client Approval Sign-off
                      </p>
                      <div className="flex flex-col items-start md:items-end space-y-1">
                        <span className="print-only hidden print:inline font-signature italic text-slate-800 text-sm">
                          {signerSignature || '...........................................'}
                        </span>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                          Recipient Digital Signature
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Date Signed:{' '}
                          <span className="text-slate-700 font-semibold">{issueDate}</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="whitespace-pre-line leading-relaxed text-slate-500">{finePrint}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Standard aesthetic thank you footer */}
              <div
                style={{ borderTopColor: brandColor }}
                className="mt-8 pt-4 border-t-2 text-[9px] text-slate-400 uppercase tracking-widest font-extrabold flex flex-col sm:flex-row justify-between items-center gap-2"
              >
                <p>
                  {docType === 'receipt' ? receiptThankYouMessage : 'Thank you for your valued business.'}
                </p>
                <p className="text-[8px] text-slate-300">
                  Powered by Invoice Studio
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
