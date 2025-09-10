export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok:false, error:"Method Not Allowed" });
  const { imageBase64 = "", meatType = "pork" } = req.body || {};
  const allowed = new Set(["pork","beef","chicken"]);
  const t = String(meatType||"").toLowerCase();
  if (!allowed.has(t)) return res.status(400).json({ ok:false, error:"meatType must be 'pork' | 'beef' | 'chicken'" });
  const str = `${t}:${(imageBase64||"").slice(0,128)}`;
  let hash=0; for (let i=0;i<str.length;i++) hash=(hash*31+str.charCodeAt(i))>>>0;
  const level=(hash%5)+1, score=20*level;
  const labels={1:"Không an toàn",2:"Gần hỏng",3:"Cần lưu ý",4:"Tươi dùng ngay",5:"Tươi mới"};
  const adv={pork:"Giữ ở 0–4°C, dùng trong 2–3 ngày. Tránh để ở nhiệt độ phòng quá 2 giờ.",beef:"Bảo quản riêng, 0–4°C, dùng 3–5 ngày. Rửa dao thớt sau khi chế biến.",chicken:"Luôn nấu chín kỹ. 0–4°C, dùng 1–2 ngày; đông lạnh 9–12 tháng."};
  return res.status(200).json({ ok:true, meatType:t, score, level, levelLabel:labels[level], advice:adv[t]||adv.pork });
}
