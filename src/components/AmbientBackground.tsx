const AmbientBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-1 overflow-hidden" style={{ background: 'var(--color-bg)' }}>
      <div
        className="absolute rounded-full opacity-50"
        style={{
          top: '-10%',
          left: '-10%',
          width: 300,
          height: 300,
          background: 'var(--color-teal)',
          filter: 'blur(80px)',
          animation: 'floatBlob 20s infinite alternate ease-in-out',
        }}
      />
      <div
        className="absolute rounded-full opacity-50"
        style={{
          bottom: '10%',
          right: '-10%',
          width: 400,
          height: 400,
          background: 'rgba(212, 175, 55, 0.2)',
          filter: 'blur(80px)',
          animation: 'floatBlob 20s infinite alternate ease-in-out',
          animationDelay: '-5s',
        }}
      />
      <div
        className="absolute rounded-full opacity-50"
        style={{
          top: '40%',
          left: '40%',
          width: 250,
          height: 250,
          background: 'rgba(16, 185, 129, 0.15)',
          filter: 'blur(80px)',
          animation: 'floatBlob 20s infinite alternate ease-in-out',
          animationDelay: '-10s',
        }}
      />
    </div>
  );
};

export default AmbientBackground;
