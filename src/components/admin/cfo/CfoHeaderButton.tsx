'use client';

export default function CfoHeaderButton() {
  const handleClick = () => {
    const trigger = document.getElementById('cfo-add-transaction-trigger');
    trigger?.click();
  };

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 bg-[#4F46E5] text-white rounded-lg text-sm font-medium hover:bg-[#4338CA] transition-colors"
    >
      + הוסף תנועה
    </button>
  );
}
