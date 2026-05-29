import React from 'react';

const OtpInput = ({ value, onChange, length = 4 }) => {
  const handleChange = (e) => {
    const v = e.target.value.replace(/[^0-9]/g, '').slice(0, length);
    onChange(v);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      onChange={handleChange}
      maxLength={length}
      className="w-full text-center text-2xl sm:text-4xl tracking-widest py-3 sm:py-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-bold"
      placeholder={new Array(length).fill('•').join('')}
    />
  );
};

export default OtpInput;                                                                                                              
