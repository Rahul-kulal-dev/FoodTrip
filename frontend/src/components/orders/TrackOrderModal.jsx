import { X, Clock, MapPin, RefreshCw } from 'lucide-react';
import { Lottie } from 'lottie-react';
import successAnimation from '../../assets/success-checkmark.json';

const steps = [
  { id: 1, label: 'Pending', img: '/pending-icon.png' },
  { id: 2, label: 'Preparing', img: '/preparing-icon.png' },
  { id: 3, label: 'On the Way', img: '/on-the-way-icon.png' },
  { id: 4, label: 'Delivered', img: '/delivered-icon.svg' }
];

export const TrackOrderModal = ({ order, isOpen, onClose, onRefresh }) => {
  if (!isOpen || !order) return null;

  const getStep = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'DELIVERED') return 4;
    if (s === 'OUT_FOR_DELIVERY') return 3;
    if (s === 'PREPARING') return 2;
    if (s === 'PENDING') return 1;
    return 1;
  };

  const currentStep = getStep(order.status);
  const isCancelled = false;

  const getStatusMessage = () => {
    if (currentStep === 4) return "Your order has been delivered! Enjoy your meal.";
    if (currentStep === 3) return "Your order is on the way with your food.";
    if (currentStep === 2) return "The restaurant is preparing your food.";
    return "Your order is pending and waiting for the restaurant.";
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-gray-900/60 backdrop-blur-sm font-poppins">
      <div className="bg-[#FFFFFF] w-full sm:max-w-md rounded-t-[20px] sm:rounded-[14px] shadow-[0_-4px_24px_rgba(0,0,0,0.08)] sm:shadow-[0_4px_16px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh] animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">

        <div className="p-4 sm:p-5 border-b border-[#F1F1F1] flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-[18px] font-[700] text-[#111827] tracking-tight">Track Order</h2>
            <p className="text-[13px] font-[500] text-[#6B7280] mt-0.5">Order ID: {order.id}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
          <div className="relative flex justify-between mb-8 px-2">
            <div className="absolute top-6 left-[32px] right-[32px] h-1 bg-gray-200 rounded-full z-0">
              {!isCancelled && (
                <div 
                  className="absolute top-0 left-0 h-full bg-[#FF4B2B] rounded-full z-0 transition-all duration-500"
                  style={{ width: `${Math.max(0, (currentStep - 1) / (steps.length - 1)) * 100}%` }}
                />
              )}
            </div>

            {steps.map((step) => {
              const isCompleted = currentStep >= step.id && !isCancelled;
              const isActive = currentStep === step.id && !isCancelled;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <div className={`relative w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-sm transition-colors duration-300 ${
                    isCompleted 
                      ? 'bg-[#FF4B2B] text-white' 
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {isActive && (
                      <div className="absolute inset-0 rounded-full bg-[#FF4B2B] animate-ripple"></div>
                    )}
                    <div className="relative z-10 flex items-center justify-center">
                      {step.img ? (
                        <img src={step.img} alt={step.label} className={`w-7 h-7 object-contain ${!isCompleted && 'opacity-50 grayscale'}`} />
                      ) : step.fallbackIcon ? (
                        <step.fallbackIcon className="w-6 h-6" />
                      ) : (
                        <div className="w-3 h-3 rounded-full bg-white opacity-50" />
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] sm:text-[11px] font-[600] mt-2 text-center absolute top-14 whitespace-nowrap ${
                    isCompleted ? 'text-[#111827]' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10 mb-6">
            {order.status === 'PENDING' && (
              <img
                src="/pending-icon.png"
                alt="Pending"
                className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 object-contain animate-spin"
                style={{ animationDuration: '7s' }}
              />
            )}
            {order.status === 'PREPARING' && (
              <img
                src="/preparing-icon.png"
                alt="Preparing"
                className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 object-contain animate-bounce"
              />
            )}
            {order.status === 'OUT_FOR_DELIVERY' && (
              <img
                src="/on-the-way-icon.png"
                alt="On the Way"
                className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 object-contain animate-move-left-right"
              />
            )}
            {order.status === 'DELIVERED' && (
              <div className="w-24 h-24 mx-auto mb-2 flex items-center justify-center">
                <Lottie src={successAnimation} autoplay loop={false} />
              </div>
            )}
            <h3 className={`text-[16px] font-[600] ${order.status === 'DELIVERED' ? 'text-[#16A34A]' : 'text-[#FF4B2B]'}`}>
              {order.status === 'OUT_FOR_DELIVERY' ? 'On the Way' : 
               order.status === 'PENDING' ? 'Pending' :
               order.status === 'PREPARING' ? 'Preparing' :
               order.status === 'DELIVERED' ? 'Delivered' : order.status}
            </h3>
            <p className="text-[13px] text-gray-500 mt-1">{getStatusMessage()}</p>
          </div>

          <hr className="border-[#F1F1F1] my-5" />

          {order.status === 'OUT_FOR_DELIVERY' && (order.delivery_staff_id || order.deliveryStaff) && (
            <div className="bg-[#FFF8F6] border border-[#FF4B2B]/20 rounded-[14px] p-4 mb-5">
              <h4 className="text-[14px] font-[600] text-[#111827] mb-1">Delivery Assigned</h4>
              <p className="text-[13px] text-[#6B7280]">
                <span className="font-[500] text-[#111827]">
                  {order.deliveryStaff?.name || order.delivery_staff_id?.name || 'Delivery Staff'}
                </span> is on the way with your order.
                <br/>
                Phone: <span className="font-[500] text-[#111827]">
                  {order.deliveryStaff?.phone || order.delivery_staff_id?.phone || 'N/A'}
                </span>
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-[12px] font-[600] text-gray-500 uppercase tracking-wider">Delivery Address</p>
                <p className="text-[13px] font-[500] text-[#111827] mt-1">{order.location}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <p className="text-[12px] font-[600] text-gray-500 uppercase tracking-wider">Placed Time</p>
                <p className="text-[13px] font-[500] text-[#111827] mt-1">{order.date}</p>
              </div>
            </div>
          </div>

          <hr className="border-[#F1F1F1] my-5" />

          <div>
            <h4 className="text-[14px] font-[600] text-[#111827] mb-3">Order Summary</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto no-scrollbar pr-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between items-start">
                  <p className="text-[13px] font-[500] text-[#111827]">
                    <span className="text-gray-500 mr-2">{item.quantity}x</span>
                    {item.name}
                  </p>
                  <p className="text-[13px] font-[600] text-[#111827]">₹{item.price * (item.quantity || 1)}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-dashed border-gray-200">
              <p className="text-[14px] font-[700] text-[#111827]">Total Amount</p>
              <p className="text-[16px] font-[800] text-[#FF4B2B]">₹{order.price}</p>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 pb-6 sm:pb-5 border-t border-[#F1F1F1] bg-gray-50">
          <button
            type="button"
            onClick={onRefresh}
            className="w-full py-3 bg-[#FF4B2B] hover:bg-[#E03A1F] text-white text-[14px] font-[600] rounded-[10px] transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Status
          </button>
        </div>
      </div>
    </div>
  );
};
