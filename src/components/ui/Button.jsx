export default function Button({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={
        "inline-flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold text-white shadow-sm " +
        "bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 " +
        "shadow-indigo-600/30 w-full " +
        className
      }
    >
      {children}
    </button>
  );
}
