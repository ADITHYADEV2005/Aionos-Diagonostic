import { useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  User, 
  Hash, 
  Activity, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw,
  Image as ImageIcon,
  ShieldCheck,
  Stethoscope
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AionosLogo } from "@/components/AionosLogo";

const UploadDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const file: File | undefined = location.state?.file;

  const [patientName, setPatientName] = useState("");
  const [patientId, setPatientId] = useState("");
  const [organ, setOrgan] = useState("Liver");
  const [priority, setPriority] = useState("Routine");
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const generatePatientId = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setPatientId(`PAT-${randomNum}`);
  };

  useEffect(() => {
    if (!patientId) {
      generatePatientId();
    }

    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    navigate("/ai-pipeline", {
      state: {
        patientName: patientName || "Anonymous Patient",
        patientId: patientId || `PAT-${Math.floor(100000 + Math.random() * 900000)}`,
        organ: organ || "Liver",
        priority,
        file,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] font-sans text-slate-800 flex flex-col justify-between items-center p-4 md:p-6">
      
      {/* Centered Top Header Navigation */}
      <header className="w-full max-w-4xl flex items-center justify-between py-2">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          Dashboard
        </button>

        <div className="flex items-center gap-2.5">
          <AionosLogo size="sm" showText={false} />
          <span className="font-extrabold text-slate-900 text-sm tracking-wider uppercase">
            Aionos <span className="text-[#FF7B6B]">Diagnostics</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200/80 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Secure Clinical Mode</span>
        </div>
      </header>

      {/* Main Centered Executive Workspace */}
      <main className="w-full max-w-4xl my-auto flex flex-col items-center justify-center py-4">
        
        {/* Step Indicator Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-slate-200/80 shadow-sm text-xs font-semibold text-slate-500 mb-3">
            <span className="text-slate-400">Step 2 of 3</span>
            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
            <span className="text-[#FF7B6B] font-bold">Diagnostic Metadata</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Patient Scan Details
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Provide patient information to calibrate the multi-stage Hepatic AI Segmentation & Shear-Wave Engine.
          </p>
        </div>

        {/* Perfectly Centered Executive Card */}
        <div className="w-full bg-white rounded-3xl shadow-2xl border border-slate-200/70 overflow-hidden grid grid-cols-1 md:grid-cols-12">
          
          {/* Left Column: Ultrasound Scan Preview */}
          <div className="md:col-span-5 bg-gradient-to-b from-slate-50 to-slate-100/60 p-6 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#FF7B6B]" />
                  Uploaded Scan
                </span>
                <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                  B-MODE SCAN
                </span>
              </div>

              {/* Centered Image Preview Frame */}
              <div className="relative rounded-2xl overflow-hidden border border-slate-900/10 bg-slate-950 aspect-[4/3] flex items-center justify-center group shadow-md">
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Ultrasound Scan Preview"
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-slate-900/85 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs flex justify-between items-center border border-white/10">
                      <span className="truncate max-w-[150px] text-slate-200 font-medium text-[11px]">
                        {file?.name || "ultrasound_scan.png"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {file ? `${(file.size / 1024).toFixed(0)} KB` : "Active"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6">
                    <ImageIcon className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 font-medium">Ultrasound B-Mode Scan</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Model Target Card */}
            <div className="mt-5 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF7B6B]/10 flex items-center justify-center text-[#FF7B6B] shrink-0">
                <Activity className="w-4 h-4 text-[#FF7B6B]" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  AI Diagnostics Engine
                </h4>
                <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                  EfficientNet-B0 + Marching Cubes 3D
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Form Inputs */}
          <div className="md:col-span-7 p-6 md:p-8 flex flex-col justify-between">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Form Fields */}
              <div className="space-y-4">
                
                {/* Patient Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Patient Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Enter patient full name"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF7B6B] focus:border-transparent focus:bg-white transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                {/* Patient ID */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                      Patient ID / MRN
                    </label>
                    <button
                      type="button"
                      onClick={generatePatientId}
                      className="text-[11px] font-bold text-[#FF7B6B] hover:text-[#FF5A45] flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> Auto-Generate
                    </button>
                  </div>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="PAT-100294"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold tracking-wide text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF7B6B] focus:border-transparent focus:bg-white transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                {/* Target Organ Model */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Target Organ Model
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: "Liver", active: true, badge: "Production" },
                      { name: "Kidney", active: false, badge: "Beta" },
                      { name: "Breast", active: false, badge: "Beta" },
                    ].map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setOrgan(item.name)}
                        className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-xs font-bold transition-all duration-200 ${
                          organ === item.name
                            ? "border-[#FF7B6B] bg-[#FF7B6B]/10 text-[#FF7B6B] shadow-xs"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span>{item.name}</span>
                          {organ === item.name && <CheckCircle2 className="w-3.5 h-3.5 text-[#FF7B6B]" />}
                        </div>
                        <span className={`text-[9px] mt-0.5 font-semibold ${organ === item.name ? "text-[#FF7B6B]" : "text-slate-400"}`}>
                          {item.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Clinical Priority
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Routine", "Urgent", "Follow-up"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                          priority === p
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-[#FF7B6B] hover:bg-[#FF5A45] text-white font-extrabold text-sm md:text-base py-5 rounded-xl shadow-lg shadow-[#FF7B6B]/25 hover:shadow-xl hover:shadow-[#FF7B6B]/35 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
                  Submit & Run AI Pipeline
                </Button>
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 mt-2.5 font-medium">
                  <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                  <span>Automatic B-Mode, Doppler & 3D STL Generation</span>
                </div>
              </div>

            </form>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="w-full max-w-4xl text-center py-2 text-xs text-slate-400 font-medium">
        Aionos Diagnostic Medical System · HIPAA Compliant · v2.4
      </footer>
    </div>
  );
};

export default UploadDetails;
