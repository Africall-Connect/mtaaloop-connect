export const SectionSeparator = () => {
  return (
    <div className="relative h-20">
      <svg
        className="absolute bottom-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 120"
      >
        <path
          fill="currentColor"
          d="M0,64L120,80C240,96,480,128,720,128C960,128,1200,96,1320,80L1440,64L1440,120L1320,120C1200,120,960,120,720,120C480,120,240,120,120,120L0,120Z"
        ></path>
      </svg>
    </div>
  );
};
