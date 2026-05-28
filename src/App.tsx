import { useState, useMemo } from 'react';
import { STUDENTS, COMPETENCIES, CATEGORIES, Student, RUBRICS } from './constants';
import { 
  CheckCircle2, 
  XCircle, 
  Info, 
  User, 
  Hash, 
  Calendar, 
  UserCheck, 
  Printer, 
  RotateCcw,
  AlertTriangle,
  ChevronDown,
  ClipboardList,
  LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type GradeValue = 0 | 1 | 2 | 3 | 4 | 'NA';

interface CompetencyScore {
  A: GradeValue;
  B: GradeValue;
  C1: GradeValue;
  C2: GradeValue;
  toelichting: string;
}

export default function App() {
  // Assessment info
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [assessor, setAssessor] = useState("D. Mulder");
  const [period, setPeriod] = useState("W&O5");

  // Prerequisites
  const [prereqMet, setPrereqMet] = useState<boolean | null>(null);
  const [beroepsproductenMet, setBeroepsproductenMet] = useState<boolean>(false);
  const [prereqComment, setPrereqComment] = useState("");

  // Scores
  const [scores, setScores] = useState<Record<number, CompetencyScore>>(
    COMPETENCIES.reduce((acc, comp) => ({
      ...acc,
      [comp.id]: { A: 0, B: 0, C1: 0, C2: 0, toelichting: "" }
    }), {})
  );

  const rowAnalysis = useMemo(() => {
    let hasZero = false;
    let totalPoints = 0;
    let activeRowsCount = 0;
    const zeroReasons: string[] = [];

    COMPETENCIES.forEach(comp => {
      const score = scores[comp.id];
      const hasNA = score.A === 'NA' || score.B === 'NA' || score.C1 === 'NA' || score.C2 === 'NA';
      
      if (!hasNA) {
        activeRowsCount++;
        const rowVal = (v: GradeValue) => typeof v === 'number' ? v : 0;
        const rowSum = rowVal(score.A) + rowVal(score.B) + rowVal(score.C1) + rowVal(score.C2);
        totalPoints += rowSum;

        if (score.A === 0 || score.B === 0 || score.C1 === 0 || score.C2 === 0) {
          hasZero = true;
          zeroReasons.push(comp.name);
        }
      }
    });

    const maxPoints = activeRowsCount * 16;
    const cijferNum = maxPoints > 0 ? (totalPoints / maxPoints) * 9 + 1 : 0;
    const cijfer = maxPoints > 0 ? cijferNum.toFixed(1) : "—";

    return { totalPoints, hasZero, activeRowsCount, maxPoints, cijfer, cijferNum, zeroReasons };
  }, [scores]);

  const assessmentResult = useMemo(() => {
    if (rowAnalysis.cijfer === "—") return "IN AFWACHTING";
    return rowAnalysis.cijferNum >= 5.5 ? "VOLDOENDE" : "ONVOLDOENDE";
  }, [rowAnalysis]);

  const handleScoreChange = (compId: number, field: keyof CompetencyScore, value: number | string) => {
    setScores(prev => {
      const currentScore = prev[compId];
      let newToelichting = currentScore.toelichting;

      // Handle auto-toelichting for level 0
      if (typeof value === 'number' && value === 0 && ['A', 'B', 'C1', 'C2'].includes(field)) {
        const category = CATEGORIES.find(cat => cat.id === (field === 'C1' ? 'C1' : field === 'C2' ? 'C2' : field));
        const missingText = `${category?.title} ontbreekt (niveau 0). Dit leidt tot een onvoldoende.`;
        
        if (!newToelichting.includes(missingText)) {
          newToelichting = newToelichting ? `${newToelichting.trim()}\n${missingText}` : missingText;
        }
      }

      // Handle auto-toelichting for NA
      if (value === 'NA' && ['A', 'B', 'C1', 'C2'].includes(field)) {
        const category = CATEGORIES.find(cat => cat.id === (field === 'C1' ? 'C1' : field === 'C2' ? 'C2' : field));
        const naText = `Aan ${category?.title} is niet gewerkt (NA). Deze rij telt niet mee in de berekening.`;
        
        if (!newToelichting.includes(naText)) {
          newToelichting = newToelichting ? `${newToelichting.trim()}\n${naText}` : naText;
        }
      }

      return {
        ...prev,
        [compId]: {
          ...currentScore,
          [field]: value,
          toelichting: field === 'toelichting' ? (value as string) : newToelichting
        }
      };
    });
  };

  const resetForm = () => {
    if (confirm("Weet je zeker dat je het hele formulier wilt leegmaken?")) {
      setSelectedStudent(null);
      setPeriod("W&O5");
      setPrereqMet(null);
      setBeroepsproductenMet(false);
      setPrereqComment("");
      setScores(COMPETENCIES.reduce((acc, comp) => ({
        ...acc,
        [comp.id]: { A: 0, B: 0, C1: 0, C2: 0, toelichting: "" }
      }), {}));
    }
  };

  const printForm = () => {
    const originalTitle = document.title;
    
    // YYYYMMDD based on current local time
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedDate = `${yyyy}${mm}${dd}`;
    
    // Construct filename variables
    const studentNum = selectedStudent?.id || "ONBEKEND";
    const studentName = selectedStudent?.name || "Onbekende student";
    const selectedPeriod = period || "ONBEKEND";
    
    // Set custom page title format: [YYYYMMDD]-PV-[PERIODE]-[STUDENTNUMMER]-[Naam student]
    document.title = `${formattedDate}-PV-${selectedPeriod}-${studentNum}-${studentName}`;
    
    window.print();
    
    setTimeout(() => {
      document.title = originalTitle;
    }, 150);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F2] text-[#141414] font-sans p-2 md:p-4 print:p-0 print:bg-white text-[13px]">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Header */}
        <header className="flex flex-row items-center justify-between border-b-2 border-[#009B48] pb-2 gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none text-[#009B48]">
              Beoordelingsformulier
            </h1>
            <h2 className="text-sm font-medium text-gray-600 uppercase tracking-[0.2em]">
              Periodeverslag IVK
            </h2>
          </div>
          
          <div className="flex items-center gap-2 print:hidden">
            <button 
              onClick={resetForm}
              className="flex items-center gap-1 px-2 py-1 border border-red-500 text-red-500 hover:bg-red-50 transition-colors uppercase text-[10px] font-bold tracking-widest cursor-pointer"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button 
              onClick={printForm}
              className="flex items-center gap-1 px-3 py-1 bg-[#009B48] text-white hover:bg-[#007E3A] transition-colors uppercase text-[10px] font-bold tracking-widest cursor-pointer shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Printer size={14} /> Downloaden (PDF)
            </button>
          </div>
        </header>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="group relative border border-[#141414] p-2 bg-white hover:bg-gray-50 transition-colors">
              <label className="block text-[8px] font-bold uppercase text-gray-400 mb-0.5 flex items-center gap-1">
                <User size={8} /> Naam Student
              </label>
              <div className="relative">
                <select 
                  value={selectedStudent?.id || ""} 
                  onChange={(e) => {
                    const student = STUDENTS.find(s => s.id === e.target.value);
                    setSelectedStudent(student || null);
                  }}
                  className="w-full bg-transparent border-none focus:ring-0 font-bold text-base appearance-none cursor-pointer pr-8 outline-none"
                >
                  <option value="">Selecteer student...</option>
                  {STUDENTS.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[#009B48]">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>

            <div className="border border-[#141414] p-2 bg-white">
              <label className="block text-[8px] font-bold uppercase text-gray-400 mb-0.5 flex items-center gap-1">
                <Hash size={8} /> Studentnummer
              </label>
              <div className="font-mono text-base font-bold min-h-[24px]">
                {selectedStudent?.id || "—"}
              </div>
            </div>

            <div className="border border-[#141414] p-2 bg-white">
              <label className="block text-[8px] font-bold uppercase text-gray-400 mb-0.5 flex items-center gap-1">
                <UserCheck size={8} /> Beoordelaar
              </label>
              <input 
                type="text" 
                value={assessor} 
                onChange={(e) => setAssessor(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 font-bold text-base py-0 outline-none"
              />
            </div>

            <div className="group relative border border-[#141414] p-2 bg-white hover:bg-gray-50 transition-colors">
              <label className="block text-[8px] font-bold uppercase text-gray-400 mb-0.5 flex items-center gap-1">
                <Calendar size={8} /> Periode
              </label>
              <div className="relative">
                <select 
                  value={period} 
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full bg-transparent border-none focus:ring-0 font-bold text-base appearance-none cursor-pointer pr-8 outline-none"
                >
                  {["W&O5", "W&O6", "W&O7", "W&O8"].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[#009B48]">
                  <ChevronDown size={16} />
                </div>
              </div>
            </div>
          </div>

          <div className={`relative border-2 flex flex-col justify-center items-center px-4 py-2 transition-colors duration-500 ${
            assessmentResult === "VOLDOENDE" ? "bg-green-50 border-green-600" : 
            assessmentResult === "ONVOLDOENDE" ? "bg-red-50 border-red-600" : "bg-yellow-50 border-yellow-600"
          }`}>
            <label className={`absolute top-1 left-1 text-[8px] font-black uppercase tracking-widest text-white px-1.5 py-0.5 ${
               assessmentResult === "VOLDOENDE" ? "bg-green-600" : 
               assessmentResult === "ONVOLDOENDE" ? "bg-red-600" : "bg-yellow-600"
            }`}>
              Resultaat
            </label>
            <AnimatePresence mode="wait">
              <motion.div 
                key={assessmentResult + rowAnalysis.cijfer}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="text-center"
              >
                <div className={`text-4xl font-black leading-none ${
                   assessmentResult === "VOLDOENDE" ? "text-green-700" : 
                   assessmentResult === "ONVOLDOENDE" ? "text-red-700" : "text-amber-700"
                }`}>
                  {rowAnalysis.cijfer}
                </div>
                <div className={`text-[10px] font-bold uppercase tracking-widest leading-tight ${
                  assessmentResult === "VOLDOENDE" ? "text-green-600" : 
                  assessmentResult === "ONVOLDOENDE" ? "text-red-600" : "text-amber-600"
                }`}>
                  {assessmentResult}
                </div>
                {rowAnalysis.hasZero && (
                  <div className="mt-1 text-[7px] font-bold text-red-500 uppercase max-w-[120px]">
                    Fail: Score 0 op {rowAnalysis.zeroReasons.join(", ")}
                  </div>
                )}
                {prereqMet === false && (
                  <div className="mt-1 text-[7px] font-bold text-red-500 uppercase max-w-[120px]">
                    Fail: Voorwaarden NOK
                  </div>
                )}
                {!beroepsproductenMet && (
                  <div className="mt-1 text-[7px] font-bold text-red-500 uppercase max-w-[120px]">
                    Fail: Producten missen
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Prerequisites */}
        <section className="bg-white border-l-4 border-[#009B48] shadow-sm border-y border-r border-gray-200">
          <div className="bg-[#009B48] text-white p-1.5 flex items-center gap-2">
            <AlertTriangle size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Voorwaardelijke eisen</span>
          </div>
          <div className="p-3 flex flex-row gap-4 items-center">
            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
              <p className="flex gap-1 items-start"><span className="font-bold text-[#141414]">•</span> Verslag voorzien van datum, naam, studentnr.</p>
              <p className="flex gap-1 items-start"><span className="font-bold text-[#141414]">•</span> Spelling en grammatica zijn correct.</p>
              <p className="flex gap-1 items-start"><span className="font-bold text-[#141414]">•</span> Heldere structuur.</p>
              <p className="flex gap-1 items-start"><span className="font-bold text-[#141414]">•</span> Word bestand (*.doc / *.docx).</p>
            </div>
            
            <div className="flex flex-row items-center gap-3">
              <div className="flex flex-row gap-2">
                <button 
                  onClick={() => setBeroepsproductenMet(!beroepsproductenMet)}
                  className={`px-3 py-1.5 flex flex-col items-center gap-0.5 border transition-all cursor-pointer ${
                    beroepsproductenMet ? "bg-[#009B48] text-white border-[#009B48]" : "bg-white border-gray-200 text-gray-400 hover:border-[#009B48]"
                  }`}
                >
                  <ClipboardList size={14} />
                  <span className="text-[7px] font-bold uppercase">Producten {beroepsproductenMet ? "OK" : "NOK"}</span>
                </button>
                <div className="flex flex-row border border-gray-200">
                  <button 
                    onClick={() => setPrereqMet(true)}
                    className={`px-3 py-1.5 flex flex-col items-center gap-0.5 transition-all cursor-pointer border-r border-gray-200 ${
                      prereqMet === true ? "bg-green-600 text-white" : "bg-white text-gray-300"
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    <span className="text-[7px] font-bold uppercase text-inherit">Vold.</span>
                  </button>
                  <button 
                    onClick={() => setPrereqMet(false)}
                    className={`px-3 py-1.5 flex flex-col items-center gap-0.5 transition-all cursor-pointer ${
                      prereqMet === false ? "bg-red-600 text-white" : "bg-white text-gray-300"
                    }`}
                  >
                    <XCircle size={14} />
                    <span className="text-[7px] font-bold uppercase text-inherit">Onvold.</span>
                  </button>
                </div>
              </div>
              <textarea 
                placeholder="Toelichting..."
                value={prereqComment}
                onChange={(e) => setPrereqComment(e.target.value)}
                className="w-48 h-10 text-[10px] border-gray-200 focus:ring-[#009B48] focus:border-[#009B48] resize-none outline-none p-1 border shadow-inner"
              />
            </div>
          </div>
        </section>

        {/* Competency Table */}
        <div className="overflow-x-auto border-t-2 border-[#009B48] shadow-md">
          <table className="w-full border-collapse bg-white table-fixed">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="p-2 text-left border-r border-gray-200 w-[20%] bg-gray-100">
                  <div className="text-[8px] font-black uppercase text-gray-400">Competentie</div>
                </th>
                {CATEGORIES.map(cat => (
                  <th key={cat.id} className="p-1 text-center border-r border-gray-200 relative group w-[10%] text-[10px]">
                    <div className="text-[8px] font-black uppercase text-gray-400">{cat.id}</div>
                    <div className="font-bold leading-none">{cat.title.split(' ')[0]}</div>
                    <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 mt-2 hidden group-hover:block z-20 w-40 p-2 bg-[#141414] text-white text-[9px] leading-relaxed shadow-xl pointer-events-none text-left">
                      {cat.description}
                    </div>
                  </th>
                ))}
                <th className="p-2 text-left w-[40%]">
                  <div className="text-[8px] font-black uppercase text-gray-400">Toelichting</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPETENCIES.map((comp, idx) => {
                const scoreObj = scores[comp.id];
                const isExcluded = scoreObj.A === 'NA' || scoreObj.B === 'NA' || scoreObj.C1 === 'NA' || scoreObj.C2 === 'NA';
                
                return (
                  <tr key={comp.id} className={`border-b border-gray-100 transition-colors hover:bg-gray-50/50 ${idx % 2 === 1 ? 'bg-gray-50/20' : ''} ${isExcluded ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                    <td className="p-1.5 border-r border-gray-100 group align-top">
                      <div className="flex flex-col">
                        <span className={`font-bold text-[11px] leading-tight text-[#141414] ${isExcluded ? 'line-through' : ''}`}>{comp.name}</span>
                        <div className="mt-0.5 text-[9px] text-gray-400 line-clamp-1 leading-tight group-hover:text-gray-600 transition-colors">
                          {RUBRICS[comp.id]?.[scoreObj.A === 'NA' ? 1 : (typeof scoreObj.A === 'number' && scoreObj.A > 0 ? scoreObj.A : 1)] || "..."}
                        </div>
                      </div>
                    </td>
                    {['A', 'B', 'C1', 'C2'].map(field => (
                      <td key={field} className="p-1 border-r border-gray-100 align-middle">
                        <div className="flex flex-col items-center gap-0.5">
                          <select 
                            value={scores[comp.id][field as keyof CompetencyScore]}
                            onChange={(e) => handleScoreChange(comp.id, field as keyof CompetencyScore, e.target.value === 'NA' ? 'NA' : parseInt(e.target.value))}
                            className={`w-10 h-7 text-center border-gray-200 rounded-none focus:ring-[#009B48] focus:border-[#009B48] font-bold text-xs p-0 appearance-none cursor-pointer outline-none border transition-all ${
                              scores[comp.id][field as keyof CompetencyScore] === 0 ? 'text-red-500 bg-red-50 border-red-200' : 
                              scores[comp.id][field as keyof CompetencyScore] === 'NA' ? 'text-blue-500 bg-blue-50 border-blue-200' : 'text-[#009B48] border-gray-300'
                            }`}
                          >
                            <option value="NA">NA</option>
                            {[0, 1, 2, 3, 4].map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                    ))}
                    <td className="p-1 align-top">
                      <textarea 
                        value={scores[comp.id].toelichting}
                        onChange={(e) => handleScoreChange(comp.id, 'toelichting', e.target.value)}
                        placeholder="Feedback..."
                        className="w-full h-8 text-[10px] border border-transparent hover:border-gray-100 bg-transparent focus:bg-white focus:border-gray-200 resize-none transition-all p-1 outline-none leading-tight"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#009B48] text-white">
                <td colSpan={5} className="p-2 text-right font-black uppercase tracking-widest text-[9px]">
                  Totaal Punten (actieve rijen: {rowAnalysis.activeRowsCount})
                </td>
                <td className="p-2 text-center border-l border-white/20">
                  <span className="text-base font-black">{rowAnalysis.totalPoints}</span>
                </td>
                <td className="p-2 border-l border-white/20">
                   <div className="flex items-center gap-3">
                    <div className="flex flex-row items-center gap-2">
                      <span className="text-[8px] opacity-70">MAX: {rowAnalysis.maxPoints}</span>
                      <span className="text-sm font-black">Cijfer: {rowAnalysis.cijfer}</span>
                    </div>
                    <div className={`px-2 py-0.5 text-[9px] font-black uppercase ${
                      assessmentResult === 'VOLDOENDE' ? 'bg-white text-green-600' : 
                      assessmentResult === 'ONVOLDOENDE' ? 'bg-red-800 text-white' : 'bg-amber-500 text-black'
                    }`}>
                      {assessmentResult}
                    </div>
                   </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Legend / Info */}
        <footer className="grid grid-cols-2 gap-4 py-4 opacity-70 print:opacity-100">
          <div className="space-y-1">
            <h4 className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
              <Info size={10} /> Richtlijnen
            </h4>
            <div className="flex gap-3">
              <div className="flex gap-1 items-baseline">
                <span className="text-xs font-black text-blue-500">NA</span>
                <span className="text-[7px] uppercase font-bold text-gray-500">Niet gewerkt</span>
              </div>
              {[0, 1, 2, 3, 4].map(v => (
                <div key={v} className="flex gap-1 items-baseline">
                  <span className={`text-xs font-black ${v === 0 ? 'text-red-500' : ''}`}>{v}</span>
                  <span className="text-[7px] uppercase font-bold text-gray-500">
                    {v === 0 ? 'Ontbr.' : v === 1 ? 'Matig' : v === 2 ? 'Basis' : v === 3 ? 'Goed' : 'Exc.'}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[9px] leading-tight text-gray-500">
              Cijfer ≥ 5.5 is voldoende, mits voldaan aan de voorwaardelijke eisen en geen niveau 0.
            </p>
          </div>
          
          <div className="flex items-end justify-end">
            <div className="text-right">
              <div className="text-[8px] font-black uppercase tracking-tight text-gray-400">Periodeverslag IVK | v1.2.1-Compact</div>
            </div>
          </div>
        </footer>
      </div>
      
      {/* Floating Summary (Mobile only) */}
      <AnimatePresence>
        {rowAnalysis.totalPoints > 0 && (
          <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="fixed bottom-4 right-4 md:hidden z-[100] flex items-center gap-2 px-6 py-4 bg-[#009B48] text-white shadow-2xl rounded-xl border border-white/20"
          >
            <div className="flex flex-col leading-none">
              <span className="text-[8px] font-black uppercase opacity-70">Cijfer</span>
              <span className="text-2xl font-black">{rowAnalysis.cijfer}</span>
            </div>
            <div className="h-8 w-px bg-white/20 mx-3" />
            <div className={`text-[10px] font-black uppercase ${
              assessmentResult === 'VOLDOENDE' ? 'text-green-300' : 
              assessmentResult === 'ONVOLDOENDE' ? 'text-red-200' : 'text-amber-200'
            }`}>
              {assessmentResult}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
