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
  const [period, setPeriod] = useState("W&O5 of W&O 6");

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
    if (prereqMet === false) return "ONVOLDOENDE";
    if (!beroepsproductenMet) return "ONVOLDOENDE (Producten missen)";
    if (prereqMet === null) return "IN AFWACHTING";
    if (rowAnalysis.hasZero) return "ONVOLDOENDE (Score 0)";
    return rowAnalysis.cijferNum >= 5.5 ? "VOLDOENDE" : "ONVOLDOENDE";
  }, [prereqMet, beroepsproductenMet, rowAnalysis]);

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
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F0F4F2] text-[#141414] font-sans p-4 md:p-8 print:p-0 print:bg-white">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-start justify-between border-b-4 border-[#009B48] pb-6 gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-black uppercase tracking-tighter leading-none text-[#009B48]">
              Beoordelingsformulier
            </h1>
            <h2 className="text-xl font-medium text-gray-600 uppercase tracking-[0.2em]">
              Periodeverslag HHS
            </h2>
            <div className="h-1 w-24 bg-[#009B48] mt-2"></div>
          </div>
          
          <div className="flex flex-col items-end gap-4">
            <div className="bg-white p-2 border border-gray-200 shadow-sm print:shadow-none">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/e/e0/De_Haagse_Hogeschool_logo.png" 
                alt="HHS Logo" 
                className="h-16 md:h-20 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex gap-2 print:hidden">
              <button 
                onClick={resetForm}
                className="flex items-center gap-2 px-4 py-2 border-2 border-red-500 text-red-500 hover:bg-red-50 transition-colors uppercase text-xs font-bold tracking-widest cursor-pointer"
              >
                <RotateCcw size={16} /> Reset
              </button>
              <button 
                onClick={printForm}
                className="flex items-center gap-2 px-6 py-2 bg-[#009B48] text-white hover:bg-[#007E3A] transition-colors uppercase text-xs font-bold tracking-widest cursor-pointer shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <Printer size={16} /> Formulier Downloaden (PDF)
              </button>
            </div>
          </div>
        </header>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="group relative border border-[#141414] p-4 bg-white hover:bg-gray-50 transition-colors">
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1 flex items-center gap-1">
                <User size={10} /> Naam Student
              </label>
              <div className="relative">
                <select 
                  value={selectedStudent?.id || ""} 
                  onChange={(e) => {
                    const student = STUDENTS.find(s => s.id === e.target.value);
                    setSelectedStudent(student || null);
                  }}
                  className="w-full bg-transparent border-none focus:ring-0 font-medium text-lg appearance-none cursor-pointer pr-10 outline-none"
                >
                  <option value="">Selecteer student uit lijst...</option>
                  {STUDENTS.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.id})</option>
                  ))}
                </select>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[#009B48]">
                  <ChevronDown size={20} />
                </div>
              </div>
            </div>

            <div className="border border-[#141414] p-4 bg-white">
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1 flex items-center gap-1">
                <Hash size={10} /> Studentnummer
              </label>
              <div className="font-mono text-lg py-1.5 min-h-[36px]">
                {selectedStudent?.id || "—"}
              </div>
            </div>

            <div className="border border-[#141414] p-4 bg-white">
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1 flex items-center gap-1">
                <UserCheck size={10} /> Beoordelaar
              </label>
              <input 
                type="text" 
                value={assessor} 
                onChange={(e) => setAssessor(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 font-medium text-lg py-0 outline-none"
              />
            </div>

            <div className="border border-[#141414] p-4 bg-white">
              <label className="block text-[10px] font-bold uppercase text-gray-400 mb-1 flex items-center gap-1">
                <Calendar size={10} /> Periode
              </label>
              <input 
                type="text" 
                value={period} 
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 font-medium text-lg py-0 outline-none"
              />
            </div>
          </div>

          <div className={`relative border-4 flex flex-col justify-center items-center p-8 transition-colors duration-500 ${
            assessmentResult === "VOLDOENDE" ? "bg-green-50 border-green-600" : 
            assessmentResult === "ONVOLDOENDE" ? "bg-red-50 border-red-600" : "bg-yellow-50 border-yellow-600"
          }`}>
            <label className={`absolute top-4 left-4 text-[10px] font-black uppercase tracking-widest text-white px-2 py-0.5 ${
               assessmentResult === "VOLDOENDE" ? "bg-green-600" : 
               assessmentResult === "ONVOLDOENDE" ? "bg-red-600" : "bg-yellow-600"
            }`}>
              Cijfer Resultaat
            </label>
            <AnimatePresence mode="wait">
              <motion.div 
                key={assessmentResult + rowAnalysis.cijfer}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="text-center"
              >
                <div className={`text-6xl font-black mb-1 ${
                  assessmentResult === "VOLDOENDE" ? "text-green-700" : "text-red-700"
                }`}>
                  {rowAnalysis.cijfer}
                </div>
                <div className={`text-xl font-bold uppercase tracking-widest ${
                  assessmentResult === "VOLDOENDE" ? "text-green-600" : "text-red-600"
                }`}>
                  {assessmentResult}
                </div>
                {rowAnalysis.hasZero && (
                  <div className="mt-2 text-[10px] font-bold text-red-500 uppercase max-w-[200px]">
                    Automatic Fail: Score 0 op {rowAnalysis.zeroReasons.join(", ")}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Prerequisites */}
        <section className="bg-white border-l-8 border-[#009B48] shadow-sm overflow-hidden border-y border-r border-gray-200">
          <div className="bg-[#009B48] text-white p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">Voorwaardelijke eisen</span>
            </div>
          </div>
          <div className="p-6 flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 space-y-4 text-sm text-gray-600">
              <p className="flex gap-2"><span className="font-bold text-[#141414]">•</span> Verslag is voorzien van datum, naam student en studentnummer.</p>
              <p className="flex gap-2"><span className="font-bold text-[#141414]">•</span> Spelling en grammatica zijn correct, tekst bevat heldere structuur.</p>
              <p className="flex gap-2"><span className="font-bold text-[#141414]">•</span> Ingeleverd als Word bestand (*.doc of *.docx).</p>
              
              <div className="flex items-center gap-4 py-2 border-t border-b border-gray-100 mt-2">
                <div className="flex-1">
                  <p className="font-bold text-[#141414] text-xs uppercase flex items-center gap-2">
                    <LayoutGrid size={14} className="text-[#009B48]" /> 1 of meer beroepsproducten toegevoegd?
                  </p>
                  <p className="text-[10px] text-gray-400">Minimaal drie beroepsproducten met STARR-voorbeelden verplicht.</p>
                </div>
                <button 
                  onClick={() => setBeroepsproductenMet(!beroepsproductenMet)}
                  className={`w-24 py-2 flex flex-col items-center gap-1 border-2 transition-all cursor-pointer ${
                    beroepsproductenMet ? "bg-[#009B48] text-white border-[#009B48]" : "bg-white border-gray-200 text-gray-400 hover:border-[#009B48] hover:text-[#009B48]"
                  }`}
                >
                  <ClipboardList size={18} />
                  <span className="text-[8px] font-bold uppercase">{beroepsproductenMet ? "Toegevoegd" : "Niet toegevoegd"}</span>
                </button>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs italic">
                Een onvoldoende op dit onderdeel betekent dat het gehele verslag onvoldoende is.
              </div>
            </div>
            
            <div className="flex flex-col gap-4 w-full lg:w-auto">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setPrereqMet(true)}
                  className={`flex-1 lg:w-32 py-4 flex flex-col items-center gap-1 border-2 transition-all cursor-pointer ${
                    prereqMet === true ? "bg-green-600 text-white border-green-600 scale-105 shadow-lg" : "bg-white border-gray-200 text-gray-400 hover:border-green-600 hover:text-green-600"
                  }`}
                >
                  <CheckCircle2 size={24} />
                  <span className="text-[10px] font-bold uppercase">Voldoende</span>
                </button>
                <button 
                  onClick={() => setPrereqMet(false)}
                  className={`flex-1 lg:w-32 py-4 flex flex-col items-center gap-1 border-2 transition-all cursor-pointer ${
                    prereqMet === false ? "bg-red-600 text-white border-red-600 scale-105 shadow-lg" : "bg-white border-gray-200 text-gray-400 hover:border-red-600 hover:text-red-600"
                  }`}
                >
                  <XCircle size={24} />
                  <span className="text-[10px] font-bold uppercase">Onvoldoende</span>
                </button>
              </div>
              <textarea 
                placeholder="toelichting bij voorwaardelijke eisen..."
                value={prereqComment}
                onChange={(e) => setPrereqComment(e.target.value)}
                className="w-full lg:w-[272px] h-24 text-sm border-gray-200 focus:ring-[#009B48] focus:border-[#009B48] resize-none outline-none p-2 border shadow-inner"
              />
            </div>
          </div>
        </section>

        {/* Competency Table */}
        <div className="overflow-x-auto border-t-4 border-[#009B48] shadow-lg">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-200">
                <th className="p-4 text-left border-r border-gray-200 w-64 bg-gray-100">
                  <div className="text-[10px] font-black uppercase text-gray-400">Component</div>
                  <div className="text-sm font-bold uppercase tracking-tight">Competentie</div>
                </th>
                {CATEGORIES.map(cat => (
                  <th key={cat.id} className="p-4 text-center border-r border-gray-200 relative group min-w-[120px]">
                    <div className="text-[10px] font-black uppercase text-gray-400">{cat.id}</div>
                    <div className="text-sm font-bold">{cat.title}</div>
                    <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 mt-2 hidden group-hover:block z-20 w-48 p-3 bg-[#141414] text-white text-[10px] leading-relaxed shadow-xl pointer-events-none text-left">
                      {cat.description}
                    </div>
                  </th>
                ))}
                <th className="p-4 text-left w-64">
                  <div className="text-[10px] font-black uppercase text-gray-400">Detail</div>
                  <div className="text-sm font-bold">Toelichting</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPETENCIES.map((comp, idx) => {
                const scoreObj = scores[comp.id];
                const isExcluded = scoreObj.A === 'NA' || scoreObj.B === 'NA' || scoreObj.C1 === 'NA' || scoreObj.C2 === 'NA';
                
                return (
                  <tr key={comp.id} className={`border-b border-gray-200 transition-colors hover:bg-gray-50/50 ${idx % 2 === 1 ? 'bg-gray-50/30' : ''} ${isExcluded ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                    <td className="p-4 border-r border-gray-200 group">
                      <div className="flex items-start gap-3">
                        <span className="text-[10px] font-mono opacity-30 mt-1 leading-none">{comp.id}</span>
                        <div className="flex flex-col">
                          <span className={`font-bold text-sm leading-tight text-[#141414] ${isExcluded ? 'line-through' : ''}`}>{comp.name}</span>
                          <div className="mt-2 text-[10px] text-gray-400 italic leading-relaxed group-hover:text-gray-600 transition-colors">
                            {RUBRICS[comp.id]?.[scoreObj.A === 'NA' ? 1 : (typeof scoreObj.A === 'number' && scoreObj.A > 0 ? scoreObj.A : 1)] || "Geen rubric beschikbaar"}
                          </div>
                        </div>
                      </div>
                    </td>
                    {['A', 'B', 'C1', 'C2'].map(field => (
                      <td key={field} className="p-3 border-r border-gray-200">
                        <div className="flex flex-col items-center gap-1 group/item">
                          <select 
                            value={scores[comp.id][field as keyof CompetencyScore]}
                            onChange={(e) => handleScoreChange(comp.id, field as keyof CompetencyScore, e.target.value === 'NA' ? 'NA' : parseInt(e.target.value))}
                            className={`w-16 h-10 text-center border-gray-200 rounded-none focus:ring-[#009B48] focus:border-[#009B48] font-black text-lg p-1 appearance-none cursor-pointer outline-none border transition-all ${
                              scores[comp.id][field as keyof CompetencyScore] === 0 ? 'text-red-500 bg-red-50 border-red-200' : 
                              scores[comp.id][field as keyof CompetencyScore] === 'NA' ? 'text-blue-500 bg-blue-50 border-blue-200' : 'text-[#009B48] border-gray-300'
                            }`}
                          >
                            <option value="NA">NA</option>
                            {[0, 1, 2, 3, 4].map(v => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                          <div className={`text-[8px] font-black uppercase transition-opacity ${scores[comp.id][field as keyof CompetencyScore] === 'NA' ? 'opacity-100' : 'opacity-20 group-hover/item:opacity-100'}`}>
                            {scores[comp.id][field as keyof CompetencyScore] === 'NA' ? 'Niet act' : 'Niveau'}
                          </div>
                        </div>
                      </td>
                    ))}
                    <td className="p-2 align-top">
                      <textarea 
                        value={scores[comp.id].toelichting}
                        onChange={(e) => handleScoreChange(comp.id, 'toelichting', e.target.value)}
                        placeholder="Specifieke feedback bij deze competentie..."
                        className="w-full h-24 text-xs border border-transparent hover:border-gray-200 bg-transparent focus:bg-white focus:ring-[#009B48] focus:border-[#009B48] resize-none transition-all p-2 outline-none leading-relaxed"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[#009B48] text-white">
                <td colSpan={5} className="p-4 text-right font-black uppercase tracking-widest">
                  Totaal Punten (actieve rijen: {rowAnalysis.activeRowsCount})
                </td>
                <td className="p-4 text-center border-l border-white/20">
                  <span className="text-2xl font-black">{rowAnalysis.totalPoints}</span>
                </td>
                <td className="p-4 border-l border-white/20">
                   <div className="flex items-center gap-4">
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] opacity-70">MAX: {rowAnalysis.maxPoints}</span>
                      <span className="text-xl font-black">Cijfer: {rowAnalysis.cijfer}</span>
                    </div>
                    <div className={`px-3 py-1 text-[12px] font-black uppercase ${
                      assessmentResult === 'VOLDOENDE' ? 'bg-white text-green-600' : 'bg-red-800 text-white'
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
        <footer className="grid grid-cols-1 md:grid-cols-2 gap-8 py-8 opacity-60 hover:opacity-100 transition-opacity">
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Info size={14} /> Richtlijnen Puntentelling
            </h4>
            <div className="grid grid-cols-6 gap-2">
              <div className="flex flex-col">
                <div className="text-xl font-black text-blue-500">NA</div>
                <div className="text-[8px] uppercase font-bold text-gray-500">
                  Niet gewerkt
                </div>
              </div>
              {[0, 1, 2, 3, 4].map(v => (
                <div key={v} className="flex flex-col">
                  <div className={`text-xl font-black ${v === 0 ? 'text-red-500' : ''}`}>{v}</div>
                  <div className="text-[8px] uppercase font-bold text-gray-500">
                    {v === 0 ? 'Ontbreekt' : v === 1 ? 'Matig' : v === 2 ? 'Basis' : v === 3 ? 'Goed' : 'Exc.'}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs leading-relaxed max-w-sm">
              Gebruik de schaal van 0 tot 4 om elk onderdeel te beoordelen. 
              Punten worden automatisch opgeteld. Een cijfer van 5.5 of hoger is een voldoende, 
              mits voldaan aan de voorwaardelijke eisen.
            </p>
          </div>
          
          <div className="flex items-end justify-end">
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase text-gray-400">Genereerd voor</div>
              <div className="text-sm font-black uppercase tracking-tight">Kwaliteitssysteem W&O</div>
              <div className="text-[10px] font-mono opacity-50 mt-1">v1.2.0-STARR</div>
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
            <div className={`text-[10px] font-black uppercase ${assessmentResult.includes('VOLDOENDE') && !assessmentResult.includes('ONVOLDOENDE') ? 'text-green-300' : 'text-red-200'}`}>
              {assessmentResult}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
