'use client';

interface CopyableCouponProps {
  coupon: string;
  className?: string;
}

export default function CopyableCoupon({ coupon, className = "" }: CopyableCouponProps) {
  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(coupon);
    
    // Feedback visual temporário
    const element = e.currentTarget as HTMLElement;
    const originalText = element.innerHTML;
    element.innerHTML = '✅ Cupom copiado!';
    element.classList.add('bg-green-100', 'text-green-800');
    element.classList.remove('bg-orange-100', 'text-orange-800');
    
    setTimeout(() => {
      element.innerHTML = originalText;
      element.classList.remove('bg-green-100', 'text-green-800');  
      element.classList.add('bg-orange-100', 'text-orange-800');
    }, 1500);
  };

  return (
    <div 
      className={`bg-orange-100 text-orange-800 text-sm px-3 py-2 rounded-lg inline-block cursor-pointer hover:bg-orange-200 transition-colors select-none ${className}`}
      onClick={handleCopy}
      title="Clique para copiar o cupom"
    >
      <span className="font-medium">Cupom:</span> {coupon}
    </div>
  );
}