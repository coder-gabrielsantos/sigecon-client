export default function Input({
                                id,
                                name,
                                type = "text",
                                value,
                                onChange,
                                placeholder,
                                autoComplete,
                                required,
                              }) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      required={required}
      className="
        block w-full rounded-xl
        border border-gray-300
        bg-white
        px-3 py-2.5
        text-sm text-gray-900
        placeholder-gray-400
        shadow-sm
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
      "
    />
  );
}
