import { useLocation, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  User, 
  Hash, 
  Activity, 
  Sparkles, 
  FileText, 
  Calendar, 
  CheckCircle2, 
  RefreshCw,
  Image as ImageIcon,
  ShieldCheck
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

  // Generate random clinical Patient ID on click
  const generatePatientId = () => {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    setPatientId(`PAT-${randomNum}`);
  };

  useEffect(() => {
    // Generate initial ID if blank
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
    <div className="min-h-screen bg-[#FAF7F2] font-sans text-slate-800 flex flex-col justify-between p-4 md:p-8">
      {/* Top Header Navigation */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between py-2 mb-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 px-4 py-2 rounded-lg border border-slate-200 shadow-sm transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-3">
          <AionosLogo size="sm" showText={false} />
          <span className="font-bold text-slate-800 text-sm md:text-base tracking-wide">
            AIONOS <span className="text-[#FF7B6B]">DIAGNOSTICS</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Clinical Pipeline Active
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full flex-1 flex flex-col justify-center">
        {/* Step Indicator */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-3 bg-white px-5 py-2 rounded-full border border-slate-200 shadow-sm text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">1</span>
              Upload Scan
            </span>
            <span className="text-slate-300">/</span>
            <span className="flex items-center gap-1.5 text-[#FF7B6B] font-bold">
              <span className="w-5 h-5 rounded-full bg-[#FF7B6B] text-white flex items-center justify-center text-[10px]">2</span>
              Patient Metadata
            </span>
            <span className="text-slate-300">/</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]">3</span>
              AI Pipeline
            </span>
          </div>
        </div>

        {/* Form Card Grid */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Column: Image Preview & File Meta */}
          <div className="lg:col-span-5 bg-slate-90/50 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-slate-100 flex flex-col justify-between bg-gradient-to-b from-slate-50 to-slate-100/50">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#FF7B6B]" />
                  Uploaded Ultrasound Scan
                </span>
                <span className="text-[11px] font-semibold bg-blue-50 text-blue-600 px-2.5 py-0.5 rounded-full border border-blue-100">
                  B-Mode Frame
                </span>
              </div>

              {/* Image Preview Box */}
              <div className="relative rounded-xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-950 aspect-[4/3] flex items-center justify-center group shadow-inner">
                {imagePreview ? (
                  <>
                    <img
                      src={imagePreview}
                      alt="Ultrasound Scan Preview"
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute bottom-3 left-3 right-3 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-lg text-xs flex justify-between items-center border border-white/10">
                      <span className="truncate max-w-[180px] text-slate-200 font-medium">
                        {file?.name || "ultrasound_scan.png"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {file ? `${(file.size / 1024).toFixed(1)} KB` : "Standard"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6">
                    <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-400">Sample Ultrasound Image Selected</p>
                  </div>
                )}
              </div>
            </div>

            {/* AI Diagnostics Target Box */}
            <div className="mt-6 bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-coral-50 flex items-center justify-center text-[#FF7B6B] shrink-0 bg-[#FF7B6B]/10">
                  <Activity className="w-5 h-5 text-[#FF7B6B]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Target Organ Model
                  </h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Hepatic Shear-Wave & Segmentation Engine (Active)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Metadata Form */}
          <div className="lg:col-span-7 p-6 lg:p-10 flex flex-col justify-between">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Patient & Scan Metadata
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Enter diagnostic details to initialize AI lesion segmentation and Doppler flow reconstruction.
                </p>
              </div>

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
                      placeholder="e.g. John Doe / Patient #402"
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
                      Patient ID / Medical Record No.
                    </label>
                    <button
                      type="button"
                      onClick={generatePatientId}
                      className="text-[11px] font-semibold text-[#FF7B6B] hover:text-[#FF5A45] flex items-center gap-1 transition-colors"
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
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF7B6B] focus:border-transparent focus:bg-white transition-all duration-200"
                      required
                    />
                  </div>
                </div>

                {/* Organ Selector Pill Badges */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Diagnostic Model Target
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { name: "Liver", active: true, badge: "Supported" },
                      { name: "Kidney", active: false, badge: "Beta" },
                      { name: "Breast", active: false, badge: "Beta" },
                    ].map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setOrgan(item.name)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                          organ === item.name
                            ? "border-[#FF7B6B] bg-[#FF7B6B]/10 text-[#FF7B6B] shadow-sm ring-1 ring-[#FF7B6B]"
                            : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span>{item.name}</span>
                          {organ === item.name && <CheckCircle2 className="w-3.5 h-3.5 text-[#FF7B6B]" />}
                        </div>
                        <span className={`text-[10px] mt-0.5 font-normal ${organ === item.name ? "text-[#FF7B6B]" : "text-slate-400"}`}>
                          {item.badge}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clinical Priority */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Scan Priority Level
                  </label>
                  <div className="flex gap-2">
                    {["Routine", "Urgent / Priority", "Follow-up"].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                          priority === p
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
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
                  className="w-full bg-[#FF7B6B] hover:bg-[#FF5A45] text-white font-bold text-base py-6 rounded-xl shadow-lg shadow-[#FF7B6B]/25 hover:shadow-xl hover:shadow-[#FF7B6B]/35 transition-all duration-200 flex items-center justify-center gap-2 group"
                >
                  <Sparkles className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
                  Run AI Diagnostic Pipeline
                </Button>
                <p className="text-[11px] text-center text-slate-400 mt-2.5">
                  Generates B-Mode, Color Doppler, Shear-Wave Elastography & 3D Volume Mesh
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Subtle Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center py-4 text-xs text-slate-400">
        Aionos AI Server v2.4 · Encrypted Clinical Pipeline · HIPAA & GDPR Compliant
      </footer>
    </div>
  );
};

export default UploadDetails;
