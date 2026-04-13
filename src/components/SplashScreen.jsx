import { useState, useEffect } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const LOADING_STEPS = [
  { text: 'Memuat modul aplikasi', duration: 1200 },
  { text: 'Menghubungkan ke database ARKAS', duration: 1500 },
  { text: 'Membaca data sekolah', duration: 1000 },
  { text: 'Memuat sumber dana & tahun anggaran', duration: 1200 },
  { text: 'Menyiapkan antarmuka pengguna', duration: 1100 },
  { text: 'Hampir selesai', duration: 500 },
];

const SplashScreen = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const [version, setVersion] = useState('');

  useEffect(() => {
    if (window.arkas?.getAppVersion) {
      window.arkas.getAppVersion().then((v) => {
        if (v?.appVersion) setVersion(v.appVersion);
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    let frame;
    let start = null;
    const totalDuration = LOADING_STEPS.reduce((s, step) => s + step.duration, 0);

    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const p = Math.min(elapsed / totalDuration, 1);

      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      setProgress(Math.round(eased * 100));

      let acc = 0;
      for (let i = 0; i < LOADING_STEPS.length; i++) {
        acc += LOADING_STEPS[i].duration;
        if (elapsed < acc) { setStepIndex(i); break; }
      }

      if (p < 1) {
        frame = requestAnimationFrame(animate);
      } else {
        setStepIndex(LOADING_STEPS.length - 1);
        setFadeOut(true);
        setTimeout(() => { if (onComplete) onComplete(); }, 300);
      }
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [onComplete]);

  const currentText = LOADING_STEPS[stepIndex]?.text || LOADING_STEPS[0].text;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-white transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Animation */}
      <div className="w-72 h-72 md:w-80 md:h-80 mb-8">
        <DotLottieReact
          src="./Animation.lottie"
          loop
          autoplay
          style={{ background: 'transparent' }}
        />
      </div>

      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">SMART <span className="text-blue-600">SPJ</span></h1>
        <p className="text-slate-500 text-base font-medium">Aplikasi Pendamping ARKAS</p>
      </div>

      {/* Progress Bar */}
      <div className="w-80 space-y-3">
        <div className="relative h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-150 ease-out"
            style={{ width: progress + '%' }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-500 font-medium">{currentText}</span>
          <span className="text-sm text-slate-500 font-mono font-semibold">{progress}%</span>
        </div>
      </div>

      {/* Version */}
      {version && (
        <div className="mt-12 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">
            v{version}
          </span>
        </div>
      )}
    </div>
  );
};

export default SplashScreen;
