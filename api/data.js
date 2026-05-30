export default async function handler(req, res) {
  const SHEET_ID = '1VEFPiov4Jvj-I6-DtUl5ZJFNUpmiFZwOuly3gC2iOiM';
  const SHEET_NAME = encodeURIComponent('Hoja 1');
  const brand = req.query.brand || '';
  const tq = brand ? encodeURIComponent("SELECT * WHERE B = '" + brand + "'") : '';
  const url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:json&sheet=' + SHEET_NAME + (tq ? '&tq=' + tq : '');
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'text/html,application/json,*/*'
      }
    });
    const text = await response.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    const start = text.indexOf('setResponse(');
    if (start < 0) {
      res.status(200).json({ error: 'gviz parse error', raw: text.substring(0, 300) });
      return;
    }
    const jsonStr = text.substring(start + 12, text.lastIndexOf(')'));
    const data = JSON.parse(jsonStr);
    
    const rows = (data.table.rows || []).map(r => ({
      grupo:    r.c[0] ? String(r.c[0].v || '') : '',
      tarifa:   r.c[1] ? String(r.c[1].v || '') : '',
      familia:  r.c[2] ? String(r.c[2].v || 'OTROS').toUpperCase() : 'OTROS',
      articulo: r.c[3] ? String(r.c[3].v || '') : '',
      precio:   r.c[4] ? parseFloat(String(r.c[4].v || '0').replace(/[^0-9.]/g, '')) || 0 : 0
    })).filter(p => p.articulo && p.precio > 0);
    
    res.status(200).json({ ok: true, rows, count: rows.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
