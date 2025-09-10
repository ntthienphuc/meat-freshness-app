/* blog-api-loader.js - progressively replace static blog with DB content if API available */
(async function(){
  try{
    const res = await fetch('/api/posts');
    if(!res.ok) return;
    const { data=[] } = await res.json();
    const grid = document.querySelector('#blog-grid');
    if(!grid) return;
    grid.innerHTML = '';
    data.forEach(p => {
      const el = document.createElement('div');
      el.className = 'card';
      el.innerHTML = `
        <h3>${p.title}</h3>
        <p>${p.excerpt}</p>
        <div class="muted">${(p.tags||[]).map(t=>`<span class="tag">${t}</span>`).join('')}
        · ${p.minutes||5} phút · ${new Date(p.created_at).toLocaleDateString()}</div>
      `;
      grid.appendChild(el);
    });
  }catch(e){ /* keep static content if API fails */ }
})();
