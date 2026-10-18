'use client';
import { useId, useState, type ReactNode } from 'react';

type Point = [number, number];
const blue = '#2849ad', orange = '#d75335';
const round = (value: number) => Number(value.toFixed(2)).toLocaleString('id-ID');
function Range({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (n: number) => void }) {
  return <label className="sma-visual-control"><span>{label}<output>{value}</output></span><input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} /></label>;
}
function Figure({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return <svg className="sma-diagram" viewBox="0 0 560 290" role="img" aria-labelledby={id}><title id={id}>{title}</title>{children}</svg>;
}
function Plot({ title, series = [], dots = [], xMin = 0, xMax, yMin = 0, yMax, xLabel = 'x', yLabel = 'y' }: {
  title: string; series?: { points: Point[]; color: string; label: string }[]; dots?: Point[];
  xMin?: number; xMax: number; yMin?: number; yMax: number; xLabel?: string; yLabel?: string;
}) {
  const px = (x: number) => 65 + (x - xMin) / (xMax - xMin) * 450;
  const py = (y: number) => 238 - (y - yMin) / (yMax - yMin) * 205;
  const clip = useId().replace(/:/g, '');
  return <><Figure title={title}><defs><clipPath id={clip}><rect x="65" y="30" width="450" height="209" /></clipPath></defs>
    {[0, .25, .5, .75, 1].map(t => <g key={t}><line x1="65" x2="515" y1={238-t*205} y2={238-t*205} stroke="#ded8c8" /><text x="55" y={243-t*205} textAnchor="end">{round(yMin+t*(yMax-yMin))}</text><text x={65+t*450} y="260" textAnchor="middle">{round(xMin+t*(xMax-xMin))}</text></g>)}
    <path d="M65 30V238H515" fill="none" stroke="#1b2b63" strokeWidth="1.5" />
    {xMin < 0 && <line x1={px(0)} x2={px(0)} y1="30" y2="238" stroke="#a6aec6" />}
    {yMin < 0 && <line x1="65" x2="515" y1={py(0)} y2={py(0)} stroke="#a6aec6" />}
    <text x="515" y="284" textAnchor="end">{xLabel}</text><text x="65" y="20">{yLabel}</text>
    <g clipPath={`url(#${clip})`}>{series.map(s => <polyline key={s.label} points={s.points.map(([x,y]) => `${px(x)},${py(y)}`).join(' ')} fill="none" stroke={s.color} strokeWidth="3" />)}{dots.map(([x,y],i) => <circle key={i} cx={px(x)} cy={py(y)} r="6" fill={orange} stroke="#fffdf6" strokeWidth="2" />)}</g>
  </Figure>{series.length > 0 && <div className="sma-plot-legend">{series.map(s => <span key={s.label}><i style={{ background: s.color }} />{s.label}</span>)}</div>}</>;
}
const defaults: Record<string, number> = {
  'x-exponents': 3, 'x-linear': 8, 'x-quadratic': 0, 'x-trigonometry': 45, 'x-statistics': 12, 'x-probability': 4,
  'xi-functions': 3, 'xi-composition': 2, 'xi-transformations': 2, 'xi-circles': 90, 'xi-bivariate': 1, 'xi-regression': 4,
  'xii-sequences': 3, 'xii-interest': 3, 'xii-annuities': 60, 'xii-counting': 3, 'xii-combinatorics': 5, 'xii-compound-probability': 3,
};
export default function SmaConceptVisual({ id }: { id: string }) {
  const [n, setN] = useState(defaults[id] ?? 3);
  const [k, setK] = useState(2);
  let title = '', description = '', observation = '', picture: ReactNode, controls: ReactNode;
  const control = (label: string, min: number, max: number, step = 1) => <Range label={label} min={min} max={max} step={step} value={n} onChange={setN} />;
  switch (id) {
    case 'x-exponents': {
      title = 'Pangkat bertambah, hasil berlipat'; description = 'Setiap kenaikan satu pada pangkat menggandakan nilai untuk basis 2.';
      controls = control('Pangkat n', 0, 6); observation = `2${['⁰','¹','²','³','⁴','⁵','⁶'][n]} = ${2**n}. Jadi log₂ ${2**n} = ${n}.`;
      picture = <Plot title={`Grafik 2 pangkat x. Pada x = ${n}, hasilnya ${2**n}.`} series={[{points:Array.from({length:61},(_,i)=>[i/10,2**(i/10)] as Point),color:blue,label:'y = 2ˣ'}]} dots={[[n,2**n]]} xMax={6} yMax={64} />; break;
    }
    case 'x-linear': {
      const x = (n+2)/2, y = (n-2)/2;
      title = 'Solusi adalah titik pertemuan'; description = 'Geser jumlah x + y. Garis x − y = 2 tetap, tetapi titik yang memenuhi keduanya berpindah.';
      controls = control('Jumlah x + y',4,16); observation = `x + y = ${n} dan x − y = 2 bertemu pada (${round(x)}, ${round(y)}).`;
      picture = <Plot title={observation} series={[{points:[[0,n],[18,n-18]],color:blue,label:`x + y = ${n}`},{points:[[0,-2],[18,16]],color:orange,label:'x − y = 2'}]} dots={[[x,y]]} xMax={18} yMin={-2} yMax={18} />;break;
    }
    case 'x-quadratic': {
      title = 'Geser titik balik parabola'; description = 'Ubah h pada y = (x − h)². Bentuk parabola tetap, sedangkan puncaknya berpindah secara horizontal.';
      controls = control('Pergeseran h',-3,3); observation = `Puncak dan akar kembar berada pada x = ${n}, yaitu titik (${n}, 0).`;
      picture = <Plot title={observation} series={[{points:Array.from({length:121},(_,i)=>{const x=-6+i/10;return [x,(x-n)**2] as Point;}),color:blue,label:`y = (x − (${n}))²`}]} dots={[[n,0]]} xMin={-6} xMax={6} yMax={40} />;break;
    }
    case 'x-trigonometry': {
      const rad=n*Math.PI/180, a=Math.cos(rad)*190, b=Math.sin(rad)*190;
      title = 'Sudut berubah, perbandingan ikut berubah'; description = 'Sisi miring tetap 1 satuan. Warna oranye menunjukkan sisi depan sudut θ.';
      controls = control('Sudut θ (derajat)',15,75,5); observation = `sin ${n}° ≈ ${round(Math.sin(rad))}; cos ${n}° ≈ ${round(Math.cos(rad))}; tan ${n}° ≈ ${round(Math.tan(rad))}.`;
      picture = <Figure title={`Segitiga siku-siku bersudut ${n} derajat, sisi miring 1, depan ${round(Math.sin(rad))}, samping ${round(Math.cos(rad))}.`}><path d={`M100 230H${100+a}V${230-b}Z`} fill="#f2d87b66" stroke={blue} strokeWidth="3" /><line x1={100+a} x2={100+a} y1="230" y2={230-b} stroke={orange} strokeWidth="5" /><text x="110" y="215">θ = {n}°</text><text x={105+a/2} y="260" textAnchor="middle">samping: {round(Math.cos(rad))}</text><text x={115+a} y={235-b/2}>depan: {round(Math.sin(rad))}</text><text x={65+a/2} y={205-b/2}>miring: 1</text></Figure>;break;
    }
    case 'x-statistics': {
      const data=[4,6,8,10,n], ordered=[...data].sort((a,b)=>a-b), mean=data.reduce((a,b)=>a+b,0)/5;
      title = 'Satu nilai mengubah pusat data'; description = 'Empat nilai pertama tetap. Ubah nilai kelima, lalu bandingkan mean dan median.';
      controls = control('Nilai data kelima',0,20); observation = `Data: ${data.join(', ')}. Mean = ${round(mean)}, median = ${ordered[2]}, jangkauan = ${ordered[4]-ordered[0]}.`;
      picture = <Figure title={observation}><line x1="65" x2="515" y1="235" y2="235" stroke={blue} />{data.map((v,i)=><g key={i}><rect x={85+i*85} y={235-v*9} width="48" height={v*9} fill={i===4?orange:blue} /><text x={109+i*85} y={224-v*9} textAnchor="middle">{v}</text><text x={109+i*85} y="262" textAnchor="middle">Data {i+1}</text></g>)}<line x1="65" x2="515" y1={235-mean*9} y2={235-mean*9} stroke="#6e843b" strokeDasharray="6 4" strokeWidth="2" /><text x="65" y="25">Tinggi batang = nilai data · garis putus-putus = mean</text></Figure>;break;
    }
    case 'x-probability': {
      title = 'Kejadian dibanding seluruh kemungkinan'; description = 'Satu bola dipilih secara acak. Setiap bola sama mungkin terambil; jumlah seluruh bola tetap 10.';
      controls = control('Banyak bola merah',1,9); observation = `P(merah) = ${n}/10 = ${round(n/10)}. P(biru) = ${10-n}/10.`;
      picture = <BallTray red={n} total={10} title={observation} />;break;
    }
    case 'xi-functions': {
      const valid = n!==2;
      title = 'Masukan harus berada dalam domain'; description = 'Coba f(x) = 1/(x − 2). Pada x = 2 penyebut nol, sehingga fungsi tidak terdefinisi.';
      controls = control('Nilai masukan x',0,6); observation = valid ? `f(${n}) = 1/(${n} − 2) = ${round(1/(n-2))}.` : 'x = 2 dikeluarkan dari domain. Tidak ada titik keluaran untuk masukan ini.';
      picture = <Plot title={observation} series={[{points:Array.from({length:20},(_,i)=>[i/10,1/(i/10-2)] as Point),color:blue,label:'f(x) = 1/(x − 2)'},{points:Array.from({length:40},(_,i)=>{const x=2.1+i/10;return [x,1/(x-2)] as Point;}),color:blue,label:'Cabang kanan'}]} dots={valid?[[n,1/(n-2)]]:[]} xMax={6} yMin={-6} yMax={6} />;break;
    }
    case 'xi-composition': {
      title = 'Keluaran pertama menjadi masukan berikutnya'; description = 'Pada f ∘ g, jalankan g lebih dahulu: g(x) = x + 3, lalu f(x) = 2x.';
      controls = control('Masukan x',0,6); observation = `(f ∘ g)(${n}) = 2(${n} + 3) = ${2*(n+3)}. Urutan sebaliknya menghasilkan ${2*n+3}.`;
      picture = <div className="sma-function-flow" aria-label={observation}>{[['Masukan',n],['g: tambah 3',n+3],['f: kali 2',2*(n+3)]].map(([label,value],i)=><div key={label}><span>{label}</span><strong>{value}</strong>{i<2&&<b aria-hidden="true">→</b>}</div>)}</div>;break;
    }
    case 'xi-transformations': {
      title = 'Geser grafik ke kanan, kiri, atas, atau bawah'; description = 'Grafik awal y = x² berwarna abu-abu. Bandingkan dengan y = (x − h)² + k.';
      controls = <>{control('Pergeseran horizontal h',-3,3)}<Range label="Pergeseran vertikal k" value={k} min={-3} max={3} onChange={setK} /></>; observation = `Puncak berpindah dari (0, 0) ke (${n}, ${k}).`;
      picture = <Plot title={observation} series={[{points:Array.from({length:121},(_,i)=>{const x=-6+i/10;return [x,x*x] as Point;}),color:'#a0a3aa',label:'Grafik awal y = x²'},{points:Array.from({length:121},(_,i)=>{const x=-6+i/10;return [x,(x-n)**2+k] as Point;}),color:blue,label:'Grafik setelah digeser'}]} dots={[[n,k]]} xMin={-6} xMax={6} yMin={-5} yMax={40} />;break;
    }
    case 'xi-circles': {
      const angle=n*Math.PI/180, endX=230+85*Math.sin(angle), endY=140-85*Math.cos(angle);
      title = 'Juring adalah bagian dari satu lingkaran'; description = 'Jari-jari tetap 4 satuan. Ubah sudut pusat untuk melihat panjang busur dan luas juring.';
      controls = control('Sudut pusat (derajat)',30,330,30); observation = `Bagian lingkaran = ${n}/360. Panjang busur ≈ ${round(n/360*8)}π satuan; luas juring ≈ ${round(n/360*16)}π satuan².`;
      picture = <Figure title={observation}><circle cx="230" cy="140" r="85" fill="#eee9dc" stroke={blue} /><path d={`M230 140L230 55A85 85 0 ${n>180?1:0} 1 ${endX} ${endY}Z`} fill="#f2d87b" stroke={blue} strokeWidth="2" /><path d={`M230 55A85 85 0 ${n>180?1:0} 1 ${endX} ${endY}`} fill="none" stroke={orange} strokeWidth="5" /><circle cx="230" cy="140" r="4" fill={blue} /><text x="350" y="120">θ = {n}°</text><text x="350" y="150">r = 4</text><text x="90" y="265">Busur: garis oranye · juring: daerah kuning</text></Figure>;break;
    }
    case 'xi-bivariate': {
      const points: Point[] = [1,2,3,4,5].map((x,i)=>[x,10+n*(x-3)+[1,-1,0,-1,1][i]]);
      const numerator=points.reduce((s,[x,y])=>s+(x-3)*(y-10),0), denominator=Math.sqrt(10*points.reduce((s,[,y])=>s+(y-10)**2,0));
      title = 'Baca pola hubungan dua variabel'; description = 'Ubah arah hubungan pada lima pasangan data contoh. Korelasi tidak membuktikan sebab akibat.';
      controls = control('Arah dan kemiringan pola',-2,2); observation = `Korelasi Pearson r = ${round(numerator/denominator)}. ${n>0?'Pola linear cenderung naik.':n<0?'Pola linear cenderung turun.':'Tidak ada kecenderungan linear pada data contoh ini.'}`;
      picture = <Plot title={observation} dots={points} xMax={6} yMax={20} xLabel="Variabel pertama" yLabel="Variabel kedua" />;break;
    }
    case 'xi-regression': {
      title = 'Kemiringan menentukan perubahan prediksi'; description = 'Model contoh: ŷ = 20 + bx. Ubah b, lalu lihat prediksi pada x = 4. Titik oranye menunjukkan prediksi, bukan data pengamatan.';
      controls = control('Gradien b',1,6); observation = `Untuk x = 4, ŷ = 20 + ${n} × 4 = ${20+n*4}. Setiap kenaikan satu pada x menambah prediksi sebesar ${n}.`;
      picture = <Plot title={observation} series={[{points:[[0,20],[8,20+n*8]],color:blue,label:`ŷ = 20 + ${n}x`}]} dots={[[4,20+n*4]]} xMax={8} yMax={70} yLabel="Prediksi ŷ" />;break;
    }
    case 'xii-sequences': {
      const points: Point[]=Array.from({length:6},(_,i)=>[i+1,2+i*n]);
      title = 'Beda tetap membentuk barisan aritmetika'; description = 'Suku pertama selalu 2. Setiap langkah menambah beda d yang sama.';
      controls = control('Beda d',1,6); observation = `Enam suku pertama: ${points.map(p=>p[1]).join(', ')}. Jumlahnya ${points.reduce((s,p)=>s+p[1],0)}.`;
      picture = <Plot title={observation} dots={points} xMax={6} yMax={32} xLabel="Nomor suku n" yLabel="Nilai suku Uₙ" />;break;
    }
    case 'xii-interest': {
      const compound=Array.from({length:9},(_,i)=>[i,100*1.1**i] as Point);
      title = 'Bandingkan pertumbuhan tunggal dan majemuk'; description = 'Model pembelajaran: modal awal 100 satuan, bunga 10% per tahun, tanpa biaya atau pajak.';
      controls = control('Lama waktu (tahun)',0,8); observation = `Tahun ${n}: tunggal = ${round(100*(1+.1*n))}; majemuk = ${round(100*1.1**n)} satuan.`;
      picture = <Plot title={observation} series={[{points:[[0,100],[8,180]],color:orange,label:'Bunga tunggal'},{points:compound,color:blue,label:'Bunga majemuk'}]} dots={[[n,100*1.1**n],[n,100*(1+.1*n)]]} xMax={8} yMax={240} xLabel="Tahun" yLabel="Nilai akhir" />;break;
    }
    case 'xii-annuities': {
      let balance=500;const points: Point[]=[[0,balance]];for(let i=1;i<=6;i++){balance=Math.max(0,balance*1.02-n);points.push([i,balance]);}
      title = 'Pembayaran mengurangi pokok setelah bunga'; description = 'Model pinjaman 500 satuan, bunga 2% per periode, pembayaran di akhir periode. Setelah lunas, sisa pokok tetap nol.';
      controls = control('Pembayaran per periode',20,100,10); observation = `Periode pertama: bunga 10, angsuran pokok ${n-10}, sisa pokok ${510-n}.`;
      picture = <Plot title={observation} series={[{points,color:blue,label:'Sisa pokok'}]} dots={points} xMax={6} yMax={500} xLabel="Periode" yLabel="Sisa pokok (satuan)" />;break;
    }
    case 'xii-counting': {
      title = 'Setiap pilihan dipasangkan dengan pilihan berikutnya'; description = 'Ada 3 pilihan celana. Tambahkan pilihan baju dan lihat semua pasangan yang mungkin.';
      controls = control('Jumlah pilihan baju',1,5); observation = `${n} baju × 3 celana = ${n*3} pasangan berbeda.`;
      picture = <div className="sma-combinations" aria-label={observation}>{Array.from({length:n},(_,i)=>Array.from({length:3},(_,j)=><span key={`${i}-${j}`}>Baju {i+1}<b>+</b>Celana {j+1}</span>))}</div>;break;
    }
    case 'xii-combinatorics': {
      const pairs: [number,number][]=[];for(let i=1;i<=n;i++)for(let j=i+1;j<=n;j++)pairs.push([i,j]);
      title = 'Tim tanpa jabatan berbeda dari susunan jabatan'; description = 'Setiap kotak menunjukkan satu tim berisi dua siswa tanpa jabatan. Menukar urutan nama tidak menambah tim baru.';
      controls = control('Jumlah siswa yang tersedia',3,7); observation = `C(${n},2) = ${pairs.length} tim. Untuk ketua dan wakil, P(${n},2) = ${n*(n-1)} susunan, dua kali banyak tim.`;
      picture = <div className="sma-combinations" aria-label={observation}>{pairs.map(([a,b])=><span key={`${a}-${b}`}>Siswa {a}<b>&</b>Siswa {b}</span>)}</div>;break;
    }
    case 'xii-compound-probability': {
      title = 'Tanpa pengembalian, ruang sampelnya berubah'; description = 'Awalnya ada 10 bola. Diketahui bola pertama yang terambil merah dan tidak dikembalikan.';
      controls = control('Jumlah merah sebelum pengambilan',2,8); observation = `Sebelum: P(merah) = ${n}/10. Setelah satu merah diambil: P(merah berikutnya | pertama merah) = ${n-1}/9 ≈ ${round((n-1)/9)}.`;
      picture = <div><p className="sma-visual-caption">Setelah satu bola merah diambil: {n-1} merah dan {10-n} biru tersisa.</p><BallTray red={n-1} total={9} title={observation} /></div>;break;
    }
    default: return null;
  }
  return <section className="sma-interactive" aria-label={title}><h2>{title}</h2><p>{description}</p><div className="sma-visual-controls">{controls}</div>{picture}<p className="sma-visual-observation" role="status">{observation}</p><small className="sma-visual-rounding">Nilai desimal ditampilkan dengan pembulatan hingga dua angka di belakang koma.</small></section>;
}
function BallTray({red,total,title}:{red:number;total:number;title:string}) {
  return <Figure title={title}>{Array.from({length:total},(_,i)=><g key={i}><circle cx={100+(i%5)*85} cy={90+Math.floor(i/5)*100} r="28" fill={i<red?orange:blue} /><text x={100+(i%5)*85} y={95+Math.floor(i/5)*100} textAnchor="middle" fill="white">{i<red?'M':'B'}</text></g>)}<text x="280" y="270" textAnchor="middle">M = merah · B = biru · semua bola sama mungkin dipilih</text></Figure>;
}
