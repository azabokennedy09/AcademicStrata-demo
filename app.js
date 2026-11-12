
var map={home:"home",dashboard:"dashboard",faq:"faqpage",privacy:"privacy",terms:"terms",cookies:"cookies",about:"about",team:"team",services:"services",guides:"services","a-level":"services","o-level":"services","exam-prep":"services",tutoring:"services",resources:"resources",free:"resources",premium:"resources","lesson-notes":"resources","guide-books":"resources","lesson-plans":"resources","schemes-of-work":"resources","exam-papers":"resources","activities-of-integration":"resources",blog:"blog","blog-lesson-notes":"blog","blog-articles":"blog","blog-news":"blog","blog-global-news":"blog",contact:"contact"};
var TT={home:"Academicstrata | Study Guides for High School Students",about:"About | Academicstrata",faqpage:"FAQ | Academicstrata",team:"Our Team | Academicstrata",services:"Services | Academicstrata",resources:"Resources | Academicstrata",blog:"Blog | Academicstrata",contact:"Contact | Academicstrata",privacy:"Privacy Policy | Academicstrata",terms:"Terms & Conditions | Academicstrata",cookies:"Cookie Policy | Academicstrata",dashboard:"Admin | Academicstrata"};
function route(){var h=(location.hash||"#home").slice(1);if(!map[h]&&h.indexOf("post-")!==0&&h.indexOf("res-")!==0){var ah=document.getElementById("art-"+h);if(ah){ah.scrollIntoView();return}}var pg=map[h]||(h.indexOf("post-")===0?"post":h.indexOf("res-")===0?"resource":"home");
document.querySelectorAll("[data-page]").forEach(function(s){s.hidden=s.id!==pg});
document.querySelectorAll("nav [data-p]").forEach(function(a){var on=a.dataset.p===(pg==="post"?"blog":pg==="resource"?"resources":pg);a.classList.toggle("on",on);if(on&&a.tagName==="A")a.setAttribute("aria-current","page");else a.removeAttribute("aria-current")});
document.querySelectorAll(".dd.open").forEach(function(d){d.classList.remove("open")});
if(pg==="post")renderPost(h.slice(5));else if(pg==="resource")renderRes(h.slice(4));else document.title=TT[pg]||"Academicstrata";
if(pg==="blog"){var BSL={"blog-lesson-notes":"Lesson Notes","blog-articles":"Articles","blog-news":"News and Updates","blog-global-news":"Global News"};window.__bcat=BSL[h]||"all";if(typeof catSel!=="undefined"&&Array.isArray(posts)){catSel=window.__bcat;renderPosts()}}
if(items&&(h==="free"||h==="premium"||h==="resources"||RSLUG[h])){if(RSLUG[h]){rcat=RSLUG[h];filter="all"}else{filter=h==="resources"?"all":h;rcat="all"}filters();render()}
if(h==="faq"){var fa=document.querySelector(".faqall");if(fa)fa.open=true}var t=document.getElementById(h);if(t&&h!==pg&&t.closest("[data-page]")===document.getElementById(pg)){t.scrollIntoView()}else{scrollTo(0,0)}}
addEventListener("hashchange",route);route();

var loaded=false,items=[],filter="all",subj="all",sortBy="new",pend=[],isEditor=false,canPrem=false,ents={},ords={},orders=[],memb=false,meId="",meEmail="",db=null,assets=null;
var RCATS=["Lesson Notes","Guide Books","Lesson Plans","Schemes of Work","Examination Papers","Activities of Integration"],RSLUG={"lesson-notes":"Lesson Notes","guide-books":"Guide Books","lesson-plans":"Lesson Plans","schemes-of-work":"Schemes of Work","exam-papers":"Examination Papers","activities-of-integration":"Activities of Integration"},rcat="all",dcounts={};
function el(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
function render(){
renderHome();stat();if(location.hash.indexOf("#res-")===0)renderRes(location.hash.slice(5));var L=document.getElementById("list");L.textContent="";
var n=document.getElementById("qnote");n.hidden=!q;n.textContent="";if(q){n.appendChild(document.createTextNode("Showing results for “"+q+"”. "));var cb=el("button","chip","Clear search");cb.onclick=function(){q="";document.getElementById("sq").value="";render()};n.appendChild(cb)}
var shown=items.filter(function(r){return (filter==="all"||(filter==="free"&&!r.premium)||(filter==="premium"&&r.premium))&&(subj==="all"||r.subject===subj)&&(rcat==="all"||r.category===rcat)&&(!q||(r.title+" "+r.subject+" "+(r.category||"")).toLowerCase().indexOf(q)>-1)});
shown.sort(function(a,b){return sortBy==="az"?(a.title||"").localeCompare(b.title||""):(b.createdAt||0)-(a.createdAt||0)});
document.getElementById("cnt").textContent=shown.length+" of "+items.length+" resources";filters();
document.getElementById("empty").hidden=items.length>0||!loaded;if(loaded&&items.length&&!shown.length){var nm=el("p","","No resources match these filters yet. Please check back soon.");nm.style.gridColumn="1/-1";L.appendChild(nm)}
shown.forEach(function(r){
var c=el("div","card");c.appendChild(el("span",r.premium?"prem":"free",r.premium?"Premium \u00b7 $1":"Free"));
var h3=el("h3","");var al=el("a","",r.title);al.href="#res-"+r.id;h3.appendChild(al);c.appendChild(h3);c.appendChild(el("p","",r.subject+" · "+(r.category?r.category+" · ":"")+((r.assetId||"").split(".").pop()||"file").toUpperCase()+(r.size?" · "+fsz(r.size):"")+(r.createdAt?" · "+new Date(r.createdAt).toLocaleDateString():"")+" · Verified"));
var locked=r.premium&&!canPrem&&!ents[r.id];
var b=el("button","btn",locked?(memb?"Pay $1 with PayPal":"Sign in to buy ($1)"):"Download PDF");
if(locked){b.onclick=function(){buyItem(r)}}
else{b.onclick=function(){dl(r,false)}}
c.appendChild(b);if(locked&&ords[r.id]==="pending"){var pn=el("p","","Payment pending. We unlock this guide once PayPal confirms your payment.");pn.style.cssText="font-size:13px;margin:6px 0 0";c.appendChild(pn)}if(!locked&&!isEditor){var ol=el("button","chip","Open in new tab");ol.onclick=function(){dl(r,true)};ol.style.alignSelf="flex-start";c.appendChild(ol)}
if(isEditor){var ed=el("button","chip","Edit");ed.onclick=function(){editRes(r,c)};c.appendChild(ed);var d=el("button","chip","Remove");d.onclick=async function(){if(!d.dataset.sure){d.dataset.sure="1";d.textContent="Click again to confirm";setTimeout(function(){d.dataset.sure="";d.textContent="Remove"},4000);return}try{await db.collection("resources").doc(r.id).delete();items=items.filter(function(x){return x.id!==r.id});render();if(assets&&r.assetId)assets.delete(r.assetId).catch(function(){})}catch(e){d.textContent="Could not remove"}};c.appendChild(d)}
L.appendChild(c)});}
function filters(){var F=document.getElementById("filters");F.textContent="";
function chip(t,on,fn){var b=el("button","chip"+(on?" on":""),t);b.onclick=fn;F.appendChild(b)}
[["all","All"],["free","Free"],["premium","Premium"]].forEach(function(p){chip(p[1],filter===p[0],function(){filter=p[0];render()})});
chip("All subjects",subj==="all",function(){subj="all";render()});
var seen={};items.forEach(function(r){if(r.subject&&!seen[r.subject]){seen[r.subject]=1;chip(r.subject,subj===r.subject,function(){subj=r.subject;render()})}});var br=el("span","");br.style.cssText="flex-basis:100%;height:0";F.appendChild(br);chip("All types",rcat==="all",function(){rcat="all";render()});RCATS.forEach(function(n){chip(n,rcat===n,function(){rcat=n;render()})})}
var CATS=["Lesson Notes","Articles","News and Updates","Global News"],catSel=window.__bcat||"all";
var CSLUG={"Lesson Notes":"blog-lesson-notes","Articles":"blog-articles","News and Updates":"blog-news","Global News":"blog-global-news"};
var CDESC={"Lesson Notes":"Topic notes and summaries for your revision.","Articles":"Study advice, guides and features for learners and teachers.","News and Updates":"Announcements and updates from Academicstrata.","Global News":"Education news from around the world."};
function goCat(v){var hs=v==="all"?"blog":CSLUG[v];if(hs){if(location.hash==="#"+hs){catSel=v;renderPosts()}else location.hash=hs}else{catSel=v;renderPosts()}}
function blogCats(){var F=document.getElementById("blogcats");if(!F)return;F.textContent="";var cnt={};posts.forEach(function(p){if(p.category)cnt[p.category]=(cnt[p.category]||0)+1});
var names=CATS.slice();Object.keys(cnt).forEach(function(c){if(names.indexOf(c)<0)names.push(c)});F.hidden=false;
function add(label,val,n){var b=el("button","chip"+(catSel===val?" on":""),label+" ("+n+")");b.type="button";b.setAttribute("aria-pressed",catSel===val?"true":"false");b.onclick=function(){goCat(val)};F.appendChild(b)}
add("All","all",posts.length);names.forEach(function(c){add(c,c,cnt[c]||0)});
var dsc=document.getElementById("blogcatdesc");if(dsc){dsc.hidden=!CDESC[catSel];dsc.textContent=CDESC[catSel]||""}}
var OKT={P:"p",H1:"h2",H2:"h2",H3:"h3",H4:"h4",H5:"h4",H6:"h4",UL:"ul",OL:"ol",LI:"li",STRONG:"strong",B:"strong",EM:"em",I:"em",U:"u",BR:"br",BLOCKQUOTE:"blockquote",TABLE:"table",THEAD:"thead",TBODY:"tbody",TR:"tr",TH:"th",TD:"td",HR:"hr",CODE:"code",PRE:"pre",SUP:"sup",SUB:"sub",A:"a"};
var DROPT={SCRIPT:1,STYLE:1,IFRAME:1,OBJECT:1,EMBED:1,FORM:1,INPUT:1,BUTTON:1,SELECT:1,TEXTAREA:1,SVG:1,MATH:1,NOSCRIPT:1,TEMPLATE:1,HEAD:1,LINK:1,META:1,TITLE:1,IMG:1,VIDEO:1,AUDIO:1,CANVAS:1};
function cleanInto(src,dst){src.childNodes.forEach(function(n){if(n.nodeType===3){dst.appendChild(document.createTextNode(n.nodeValue));return}if(n.nodeType!==1)return;
var tag=String(n.tagName).toUpperCase();if(DROPT[tag])return;var t=OKT[tag];if(!t){cleanInto(n,dst);return}
var e=document.createElement(t);var aid=n.getAttribute("id")||n.getAttribute("data-aid");if(aid&&/^[A-Za-z0-9_.:-]{1,80}$/.test(aid))e.setAttribute("data-aid",aid);
if(t==="a"){var h=(n.getAttribute("href")||"").trim();if(/^(https?:|mailto:|#)/i.test(h)){e.setAttribute("href",h);if(/^https?:/i.test(h)){e.setAttribute("target","_blank");e.setAttribute("rel","noopener noreferrer")}}}
if(t==="td"||t==="th"){["colspan","rowspan"].forEach(function(a){var v=n.getAttribute(a);if(/^\d{1,2}$/.test(v||""))e.setAttribute(a,v)})}
cleanInto(n,e);dst.appendChild(e)})}
function cleanHtml(str){var d=new DOMParser().parseFromString(String(str||""),"text/html"),box=document.createElement("div");cleanInto(d.body,box);
box.querySelectorAll("p,li,h2,h3,h4,blockquote").forEach(function(x){if(!x.textContent.trim()&&!x.querySelector("br,table"))x.remove()});return box}
var pendingHtml="",editBody="";
function loadMammoth(){return new Promise(function(res,rej){if(window.mammoth)return res(window.mammoth);var sc=document.createElement("script");sc.src="https://cdn.jsdelivr.net/npm/mammoth@1.13.0/mammoth.browser.min.js";sc.integrity="sha384-8NWE3bZDrmRI4IePMoQaEoLhAQ1MmRMJkdNgnGiHRFanTqsFKr0TmK6aSZvFJ/PO";sc.crossOrigin="anonymous";sc.onload=function(){res(window.mammoth)};sc.onerror=function(){rej(new Error("lib"))};document.head.appendChild(sc)})}
async function readArticle(f){var ext=(f.name.split(".").pop()||"").toLowerCase(),raw="",title="",desc="",imgs=0;
if(f.size>8*1024*1024)throw new Error("size");
if(ext==="docx"){var M=await loadMammoth();var r=await M.convertToHtml({arrayBuffer:await f.arrayBuffer()},{convertImage:M.images.imgElement(function(){imgs++;return Promise.resolve({src:""})})});raw=r.value}
else if(ext==="html"||ext==="htm"){raw=await f.text()}else throw new Error("type");
var dr=new DOMParser().parseFromString(raw,"text/html");var h1=dr.querySelector("h1"),tt=dr.querySelector("title"),md=dr.querySelector('meta[name="description"]');
title=cl(h1&&h1.textContent)||cl(tt&&tt.textContent);desc=cl(md&&md.getAttribute("content"));if(ext!=="docx")imgs=dr.querySelectorAll("img").length;
var box=cleanHtml(raw);
if(title){var f2=box.querySelector("h2");if(f2&&cl(f2.textContent)===title)f2.remove()}
if(!title)title=cl(f.name.replace(/\.[^.]+$/,"").replace(/[_-]+/g," "));
if(!desc){var fp=box.querySelector("p");desc=fp?cl(fp.textContent):"";if(desc.length>140){desc=desc.slice(0,140);desc=desc.slice(0,desc.lastIndexOf(" ")>60?desc.lastIndexOf(" "):140).replace(/[,;:\s]+$/,"")+"…"}}
var out=box.innerHTML;if(!cl(box.textContent))throw new Error("empty");if(out.length>200000)throw new Error("big");
return{html:out,title:title,desc:desc,imgs:imgs,words:tx(box).split(" ").length}}
function showImported(html,label){var pv=document.getElementById("bpv");pv.textContent="";var box=cleanHtml(html);while(box.firstChild)pv.appendChild(box.firstChild);pv.hidden=false;
var n=document.getElementById("bfn");n.hidden=false;n.textContent=label;document.getElementById("bfc").hidden=false;var bb=document.getElementById("bb");bb.value="";bb.readOnly=true;bb.placeholder="The article will use the content from the file."}
function clearFile(){pendingHtml="";var bf=document.getElementById("bf");if(bf)bf.value="";var pv=document.getElementById("bpv");if(!pv)return;pv.hidden=true;pv.textContent="";var bn0=document.getElementById("bfn");bn0.hidden=true;bn0.textContent="";document.getElementById("bfc").hidden=true;var bb=document.getElementById("bb");bb.readOnly=false;bb.placeholder=""}
var posts=[];
setTimeout(function(){loaded=true;render();renderPosts()},4000);
function thumb(p){if(p.thumb){var i=document.createElement("img");i.src=p.thumb;i.alt="";i.className="tn";i.loading="lazy";return i}
var d=el("div","tn ph2");d.innerHTML='<svg viewBox="0 0 120 68" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M30 54h60"/><rect x="38" y="30" width="9" height="24" rx="1.5"/><rect x="50" y="22" width="9" height="32" rx="1.5"/><path d="M63 28l8-2.3 6.5 25.6-8 2.3z"/></svg>';return d}
function pcard(p,full){var c=el("a","card");c.href="#post-"+p.id;
c.appendChild(thumb(p));
c.appendChild(el("div","tag",p.category+" · "+new Date(p.createdAt||0).toLocaleDateString()));
c.appendChild(el("h3","",p.title));
c.appendChild(el("p","",p.summary||""));
var rm=el("span","","Read article →");rm.style.cssText="font-weight:600;margin-top:4px";c.appendChild(rm)

return c}
function renderPosts(){refreshSR();var H=document.getElementById("homePosts"),B=document.getElementById("blogList");H.textContent="";B.textContent="";
posts.slice(0,6).forEach(function(p){H.appendChild(pcard(p,false))});
if(catSel!=="all"&&CATS.indexOf(catSel)<0&&!posts.some(function(p){return p.category===catSel}))catSel="all";blogCats();var shownP=posts.filter(function(p){return catSel==="all"||p.category===catSel});shownP.forEach(function(p){B.appendChild(pcard(p,true))});var bnn=document.getElementById("blogNone");if(bnn)bnn.hidden=!(posts.length&&!shownP.length);
document.getElementById("homePostsWrap").hidden=!posts.length;document.getElementById("blogEmpty").hidden=posts.length>0||!loaded;if((location.hash||"").indexOf("#post-")===0)renderPost(location.hash.slice(6));renderPlist()}
function rich(P,txt){var re=/\[([^\]]+)\]\((#[a-z0-9_~.-]+)\)/g,last=0,m;while((m=re.exec(txt))){if(m.index>last)P.appendChild(document.createTextNode(txt.slice(last,m.index)));var a=el("a","",m[1]);a.href=m[2];a.style.textDecoration="underline";P.appendChild(a);last=re.lastIndex}if(last<txt.length)P.appendChild(document.createTextNode(txt.slice(last)))}
function seo(p){document.title=p.title+" | Academicstrata";var md=document.querySelector('meta[name="description"]');if(!md){md=document.createElement("meta");md.name="description";document.head.appendChild(md)}md.content=p.summary||"";var ld=document.getElementById("ld");if(!ld){ld=document.createElement("script");ld.id="ld";ld.type="application/ld+json";document.head.appendChild(ld)}ld.textContent=JSON.stringify({"@context":"https://schema.org","@type":"Article",headline:p.title,description:p.summary,datePublished:new Date(p.createdAt||0).toISOString(),author:{"@type":"Organization",name:"Academicstrata"},publisher:{"@type":"Organization",name:"Academicstrata"}})}
function renderPost(id){var V=document.getElementById("postView");V.textContent="";var p=null;(posts||[]).forEach(function(x){if(x.id===id)p=x});
if(!p){V.appendChild(el("h1","",posts&&posts.length?"Post not found":"Loading…"));var b0=el("a","btn alt","Back to all posts");b0.href="#blog";V.appendChild(b0);return}
seo(p);var tg=el("div","tag");var ca=el("a","",p.category||"Post");ca.href="#blog";ca.style.cssText="text-decoration:underline;text-underline-offset:3px";ca.onclick=function(e){e.preventDefault();var c0=p.category||"all";if(CSLUG[c0])location.hash=CSLUG[c0];else{location.hash="blog";setTimeout(function(){catSel=c0;renderPosts()},40)}};tg.appendChild(ca);tg.appendChild(document.createTextNode(" · "+new Date(p.createdAt||0).toLocaleDateString()+" · "+Math.max(1,Math.round((p.body||"").split(/\s+/).length/200))+" min read"));V.appendChild(tg);var h=el("h1","",p.title);h.style.marginTop="8px";V.appendChild(h);var t=thumb(p);t.style.margin="16px 0 24px";V.appendChild(t);
if(p.html){var ab=el("div","article"),cb=cleanHtml(p.html);while(cb.firstChild)ab.appendChild(cb.firstChild);ab.querySelectorAll("[data-aid]").forEach(function(x){x.id="art-"+x.getAttribute("data-aid")});ab.addEventListener("click",function(e){var a=e.target.closest("a");if(!a)return;var h=a.getAttribute("href")||"";if(h.charAt(0)!=="#")return;var id=h.slice(1);if(map[id]||id.indexOf("post-")===0)return;e.preventDefault();tocGo(ab,a)});V.appendChild(ab)}else(p.body||"").split(/\n\n+/).forEach(function(b){if(b.indexOf("### ")===0){V.appendChild(el("h3","",b.slice(4)))}else if(b.indexOf("## ")===0){V.appendChild(el("h2","",b.slice(3)))}else if(b.indexOf("- ")===0){var u=el("ul","");b.split("\n").forEach(function(l){var li=el("li","");rich(li,l.replace(/^- /,""));u.appendChild(li)});V.appendChild(u)}else{var pp=el("p","");rich(pp,b);V.appendChild(pp)}});
var bk=el("a","btn alt","Back to all posts");bk.href="#blog";bk.style.marginTop="24px";V.appendChild(bk)}
function renderHome(){var H=document.getElementById("homeRes");H.textContent="";
items.slice(0,12).forEach(function(r){var c=el("a","card");c.href="#res-"+r.id;c.appendChild(el("span",r.premium?"prem":"free",r.premium?"Premium \u00b7 $1":"Free"));c.appendChild(el("h3","",r.title));c.appendChild(el("p","",r.subject));var oa=el("p","","View details \u2192");oa.style.cssText="font-weight:600;margin-top:4px";c.appendChild(oa);H.appendChild(c)});
document.getElementById("homeResWrap").hidden=!items.length}
filters();render();renderPosts();route();

(async function(){
try{
var user=await claude.use("user");isEditor=!!(user&&user.canEdit());
if(isEditor){var ba=document.getElementById("blogadmin");if(ba)ba.hidden=false;var g1=document.getElementById("dashgate");if(g1)g1.hidden=true;var g2=document.getElementById("dashbody");if(g2)g2.hidden=false;if(!document.querySelector('.auth a[href="#dashboard"]')){var ad2=el("a","btn","Admin");ad2.href="#dashboard";var au=document.querySelector(".auth");au.insertBefore(ad2,au.firstChild)}}canPrem=!!(user&&user.premium());memb=!!(user&&user.isMember());meId=(user&&user.id)?user.id():"";meEmail=(user&&user.email)?user.email():"";
if(user&&user.isMember()){var si=document.getElementById("signin"),su=document.getElementById("signup");si.textContent="Sign Out";si.onclick=function(){SS.signOut()};su.hidden=true;}
if(isEditor){document.getElementById("dashgate").hidden=true;document.getElementById("dashbody").hidden=false;var gr=function(f){var e=document.getElementById("ge").value.trim(),g=document.getElementById("gm");SS.grant(e,f).then(function(n){g.textContent=n?(f?"Premium access granted.":"Premium access removed."):"No member found with that email. They must sign up first."}).catch(function(){g.textContent="Could not update. Try again."})};document.getElementById("gy").onclick=function(){gr(true)};document.getElementById("gn").onclick=function(){gr(false)}}
db=await claude.use("db");assets=await claude.use("assets");
if(db){db.collection("resources").onSnapshot(function(s){loaded=true;items=s.docs.map(function(d){var o=Object.assign({},d.data());o.id=d.id;return o});items.sort(function(a,b){return (b.createdAt||0)-(a.createdAt||0)});render()},function(){})}
if(db){db.collection("posts").onSnapshot(function(s){loaded=true;posts=s.docs.map(function(d){var o=Object.assign({},d.data());o.id=d.id;return o});posts.sort(function(a,b){return (b.createdAt||0)-(a.createdAt||0)});renderPosts()},function(){})}
if(db&&memb){db.collection("entitlements").onSnapshot(function(s){ents={};s.docs.forEach(function(d){var x=d.data();if(x&&x.resourceId&&(isEditor||x.userId===meId))ents[x.resourceId]=true});render()},function(){});
db.collection("orders").onSnapshot(function(s){ords={};orders=[];s.docs.forEach(function(d){var x=Object.assign({},d.data());x.id=d.id;orders.push(x);if(x.userId===meId&&x.status==="pending")ords[x.resourceId]="pending"});renderOrders();render()},function(){})}
if(window.SS&&SS.counts){SS.counts().then(function(m){dcounts=m;if(location.hash.indexOf("#res-")===0)renderRes(location.hash.slice(5))}).catch(function(){})}
if(db){db.collection("pagetext").onSnapshot(function(s){s.docs.forEach(function(d){var x=d.data(),n=document.querySelector('[data-k="'+x.key+'"]');if(n&&x.text)n.textContent=x.text});buildPE()},function(){buildPE()})}
if(db&&assets){document.getElementById("locked").hidden=true;document.getElementById("admin").hidden=false;document.getElementById("uph").textContent=isEditor?"Upload a file (PDF or Word)":"Submit a file for review (PDF or Word)";if(!isEditor)document.getElementById("pw").hidden=true}
if(isEditor&&db){document.getElementById("review").hidden=false;db.collection("submissions").onSnapshot(function(s){pend=s.docs.map(function(d){var o=Object.assign({},d.data());o.id=d.id;return o});renderPend()},function(){})}
if(isEditor&&db){db.collection("messages").onSnapshot(function(sn){var M=document.getElementById("msgs");M.textContent="";if(!sn.docs.length)M.appendChild(el("p","","No messages yet."));sn.docs.forEach(function(d){var x=d.data(),c=el("div","card");c.style.marginTop="10px";c.appendChild(el("h3","",x.name+" · "+x.email));c.appendChild(el("p","",x.message));M.appendChild(c)})},function(){});db.collection("subscribers").onSnapshot(function(sn){var B=document.getElementById("subs");B.textContent="";if(!sn.docs.length)B.appendChild(el("p","","No subscribers yet."));sn.docs.forEach(function(d){B.appendChild(el("p","",(d.data().name?d.data().name+" \u00b7 ":"")+d.data().email))})},function(){})}
render();renderPosts();
}catch(e){}
})();
document.querySelectorAll(".tg").forEach(function(b){b.onclick=function(){var d=b.parentNode,o=d.classList.contains("open");document.querySelectorAll(".dd.open").forEach(function(x){x.classList.remove("open")});document.querySelectorAll(".tg").forEach(function(x){x.setAttribute("aria-expanded","false")});if(!o){d.classList.add("open");b.setAttribute("aria-expanded","true")}}});
document.addEventListener("click",function(e){if(!e.target.closest(".dd"))document.querySelectorAll(".dd.open").forEach(function(x){x.classList.remove("open")})});
document.getElementById("cf").onsubmit=async function(e){e.preventDefault();var n=document.getElementById("cn").value.trim(),m=document.getElementById("ce").value.trim(),t=document.getElementById("cm").value.trim(),s=document.getElementById("cs");
if(!n||!t||!/^\S+@\S+\.\S+$/.test(m)){s.textContent="Please enter your name, a valid email and your message.";return}
try{await db.collection("messages").add({name:n,email:m,message:t});s.textContent="Thank you. Your message was sent. We will reply soon.";["cn","ce","cm"].forEach(function(i){document.getElementById(i).value=""})}catch(err){s.textContent="Sorry, it did not send. Please email azabokennedy09@gmail.com."}};
document.getElementById("totop").onclick=function(e){e.preventDefault();scrollTo({top:0,behavior:"smooth"})};
document.getElementById("totop").hidden=true;addEventListener("scroll",function(){document.getElementById("totop").hidden=scrollY<400},{passive:true});
(function(){var b=document.getElementById("ck"),k="ss_ck",seen=false;try{seen=localStorage.getItem(k)==="1"}catch(e){}
if(!seen)b.hidden=false;
document.getElementById("cks").onclick=function(){b.hidden=false};document.getElementById("ckok").onclick=function(){b.hidden=true;try{localStorage.setItem(k,"1")}catch(e){}}})();
document.querySelectorAll(".cat").forEach(function(a){a.onclick=function(e){e.preventDefault();q=a.dataset.c.toLowerCase();document.getElementById("sq").value=a.dataset.c;location.hash="resources";render()}});
document.getElementById("sub").onsubmit=async function(e){e.preventDefault();var sn=document.getElementById("sn").value.trim(),m=document.getElementById("se").value.trim(),s=document.getElementById("ss");
if(!/^\S+@\S+\.\S+$/.test(m)){s.textContent="Please enter a valid email address.";return}
try{await db.collection("subscribers").add({name:sn,email:m});s.textContent="Thank you. You are subscribed.";document.getElementById("se").value="";document.getElementById("sn").value=""}catch(err){s.textContent="Sorry, it did not work. Please email azabokennedy09@gmail.com."}};
document.getElementById("srt").onchange=function(){sortBy=this.value;render()};
function renderPend(){var P=document.getElementById("pend");P.textContent="";document.getElementById("pc").textContent="("+pend.length+")";document.getElementById("pe").hidden=pend.length>0;
pend.forEach(function(r){var c=el("div","card");c.appendChild(el("h3","",r.title));c.appendChild(el("p","",r.subject+" · "+((r.assetId||"").split(".").pop()||"file").toUpperCase()+(r.size?" · "+fsz(r.size):"")));
var v=el("a","btn alt","Open file");v.href=r.url;v.target="_blank";v.rel="noopener";v.style.alignSelf="flex-start";c.appendChild(v);
var row=el("div","row"),pl=el("label","",""),cb=document.createElement("input");pl.style.cssText="flex-direction:row;align-items:center;gap:8px";cb.type="checkbox";cb.style.minHeight="auto";pl.appendChild(cb);pl.appendChild(document.createTextNode("Premium"));row.appendChild(pl);
var ok=el("button","btn","Approve");ok.onclick=async function(){try{await db.collection("resources").add({title:r.title,subject:r.subject,category:r.category||"",description:r.description||"",premium:cb.checked,assetId:r.assetId,url:r.url,size:r.size,createdAt:Date.now(),verified:true});await db.collection("submissions").doc(r.id).delete()}catch(e){alert("Could not approve. Try again.")}};
var no=el("button","chip","Reject");no.onclick=async function(){if(!no.dataset.sure){no.dataset.sure="1";no.textContent="Click again to confirm";setTimeout(function(){no.dataset.sure="";no.textContent="Reject"},4000);return}try{await db.collection("submissions").doc(r.id).delete();pend=pend.filter(function(x){return x.id!==r.id});renderPend();if(assets&&r.assetId)assets.delete(r.assetId).catch(function(){})}catch(e){no.textContent="Could not reject"}};
row.appendChild(ok);row.appendChild(no);c.appendChild(row);P.appendChild(c)})}
document.getElementById("lsi").onclick=function(){openAuth("Sign In")};document.getElementById("lsu").onclick=function(){openAuth("Sign Up")};
async function dl(r,open){var m=document.getElementById("msg");m.textContent="";var w=open?window.open("","_blank"):null;try{var u=await SS.url(r.assetId,!open);if(w){w.opener=null;w.location.href=u}else{var a=document.createElement("a");a.href=u;a.rel="noopener";document.body.appendChild(a);a.click();a.remove()}if(window.SS&&SS.bump){SS.bump(r.id).then(function(n){if(typeof n==="number"&&n>0){dcounts[r.id]=n;if(location.hash==="#res-"+r.id)renderRes(r.id)}}).catch(function(){})}}catch(e){if(w)w.close();m.appendChild(el("div","msg","Could not open the file. Please try again or contact us."));toast("Could not open the file. Please try again or contact us.")}}
function fsz(n){return n<1048576?Math.max(1,Math.round(n/1024))+" KB":(n/1048576).toFixed(1)+" MB"}
function editRes(r,c){c.textContent="";var t=document.createElement("input");t.value=r.title;t.setAttribute("aria-label","Title");var s=document.createElement("select");s.setAttribute("aria-label","Subject");var ds=document.createElement("textarea");ds.rows=2;ds.maxLength=400;ds.value=r.description||"";ds.setAttribute("aria-label","Description");ds.placeholder="Description (optional)";var cs=document.createElement("select");cs.setAttribute("aria-label","Type");var o0=document.createElement("option");o0.value="";o0.textContent="No type";cs.appendChild(o0);RCATS.forEach(function(n){var o=document.createElement("option");o.textContent=n;if(n===r.category)o.selected=true;cs.appendChild(o)});["Mathematics","History and Political Education","Geography","Physics","General Science","Chemistry","Biology","Entrepreneurship Education","Kiswahili","Lugbara Ti","English Language","Physical Education","Christian Religious Education (CRE)","Islamic Religious Education (IRE)","Other",r.subject].filter(function(v,i,a){return v&&a.indexOf(v)===i}).forEach(function(v){var o=document.createElement("option");o.textContent=v;if(v===r.subject)o.selected=true;s.appendChild(o)});
var pl=el("label","","");pl.style.cssText="flex-direction:row;align-items:center;gap:8px";var cb=document.createElement("input");cb.type="checkbox";cb.checked=!!r.premium;cb.style.minHeight="auto";pl.appendChild(cb);pl.appendChild(document.createTextNode("Premium"));
var m=el("div","","");m.style.fontSize="14px";var sv=el("button","btn","Save"),cn=el("button","chip","Cancel");
sv.onclick=async function(){var nt=t.value.trim();if(!nt){m.textContent="Title cannot be empty.";return}try{await db.collection("resources").doc(r.id).update({title:nt,subject:s.value,category:cs.value,description:ds.value.trim(),premium:cb.checked});r.title=nt;r.subject=s.value;r.category=cs.value;r.description=ds.value.trim();r.premium=cb.checked;render()}catch(e){m.textContent="Could not save. Try again."}};
cn.onclick=function(){render()};[t,s,cs,ds,pl,sv,cn,m].forEach(function(x){c.appendChild(x)})}

var SR={q:"",sig:""};
var PN={home:"Home",about:"About",services:"Services",faqpage:"FAQ",team:"Team",contact:"Contact",privacy:"Privacy Policy",terms:"Terms",cookies:"Cookie Policy"};
var PK={home:"home study guides",about:"about us story mission",services:"services tutoring exam prep a level o level",faqpage:"faq faqs frequently asked questions help",team:"team our team people founder staff",contact:"contact us email phone whatsapp location message",privacy:"privacy policy data",terms:"terms and conditions rules",cookies:"cookies cookie policy settings"};
function cl(t){return (t||"").replace(/\s+/g," ").trim()}
function tx(n){var w=document.createTreeWalker(n,NodeFilter.SHOW_TEXT),a=[],x;while((x=w.nextNode())){if(x.parentNode.closest("script,style,svg"))continue;a.push(x.nodeValue)}return cl(a.join(" "))}
function pageHash(id){for(var k in map){if(map[k]===id)return k}return"home"}
function siteIndex(){
var out=[],seen={};
function add(o){var key=o.type+"|"+o.title;if(!o.title||seen[key])return;seen[key]=1;out.push(o)}
document.querySelectorAll("section[data-page]").forEach(function(sec){
var id=sec.id;if(!PN[id])return;var ph=pageHash(id),pn=PN[id];
var h1=sec.querySelector("h1"),lead=sec.querySelector("p.lead,p.sub,.lede");
add({type:pn,title:id==="home"?"Home":(cl(h1&&h1.textContent)||pn),text:cl((h1?h1.textContent:"")+" "+(lead?lead.textContent:"")+" "+pn+" "+(PK[id]||"")),href:"#"+ph});
sec.querySelectorAll(".card,.cat,.feat,.fx,details").forEach(function(e){
if(e.closest("#homeRes,#homePosts,#hsr"))return;
var t=e.querySelector("summary,h3,h4");var title=cl(t&&t.textContent);if(!title)return;
var full=tx(e);if(full.indexOf(title)===0)full=cl(full.slice(title.length));var o={type:pn,title:title,text:full,href:"#"+(e.id&&map[e.id]?e.id:ph)};
if(e.tagName==="DETAILS"){o.type="FAQ";o.faq=e}else if(e.classList.contains("cat")){o.type="Subject";o.subject=e.dataset.c||title}
add(o)});
sec.querySelectorAll("h2").forEach(function(h){
if(h.closest("#hsr"))return;
var txt=[],skip=false,n=h.nextElementSibling;
while(n&&n.tagName!=="H2"&&n.tagName!=="H1"){if(n.matches(".card,.cat,.feat,.fx,details,.grid,.fgrid")||n.querySelector(".card,.cat,.feat,.fx,details"))skip=true;txt.push(tx(n));n=n.nextElementSibling}
if(skip||!txt.length)return;
add({type:pn,title:cl(h.textContent),text:cl(txt.join(" ")),href:"#"+(h.id&&map[h.id]?h.id:ph)})})});
(items||[]).forEach(function(r){add({type:r.premium?"Premium guide":"Free guide",title:r.title,text:cl((r.subject||"")+" study guide PDF"),href:"#resources",res:r})});
(posts||[]).forEach(function(p){add({type:"Blog",title:p.title,text:cl((p.category||"")+" "+(p.summary||"")),href:"#post-"+p.id})});
return out}
function hl(P,text,re){if(!re){P.appendChild(document.createTextNode(text));return}text.split(re).forEach(function(part,i){if(i%2){var m=document.createElement("mark");m.textContent=part;P.appendChild(m)}else if(part)P.appendChild(document.createTextNode(part))})}
function snip(text,toks){var low=text.toLowerCase(),at=-1;toks.forEach(function(w){var i=low.indexOf(w);if(i>-1&&(at<0||i<at))at=i});var st=Math.max(0,at-40);return(st>0?"…":"")+text.slice(st,st+160)+(text.length>st+160?"…":"")}
function showSR(raw,scroll,all){
var box=document.getElementById("hsr"),L=document.getElementById("hsr-l"),T=document.getElementById("hsr-t");
raw=cl(raw);SR.q=raw;SR.sig=(items||[]).length+"|"+(posts||[]).length;
if(raw.length<2){box.hidden=true;return}
var toks=raw.toLowerCase().split(" ").filter(Boolean);
var re=new RegExp("("+toks.map(function(w){return w.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}).join("|")+")","gi");
var res=[];siteIndex().forEach(function(it){var ti=it.title.toLowerCase(),tx=it.text.toLowerCase(),sc=0,ok=true;
toks.forEach(function(w){var x=0;if(ti.indexOf(w)>-1)x+=4;if(ti.split(/\W+/).some(function(a){return a.indexOf(w)===0}))x+=2;if(tx.indexOf(w)>-1)x+=1;if(!x)ok=false;sc+=x});
if(ok)res.push({it:it,sc:sc})});
res.sort(function(a,b){return b.sc-a.sc});
L.textContent="";T.textContent=res.length?res.length+(res.length===1?" result for “":" results for “")+raw+"”":"No results for “"+raw+"”";
if(!res.length){var p=el("p","none","Try a different word or a shorter search. You can also ");var a1=el("a","","browse all resources");a1.href="#resources";var a2=el("a","","contact us");a2.href="#contact";p.appendChild(a1);p.appendChild(document.createTextNode(" or "));p.appendChild(a2);p.appendChild(document.createTextNode("."));L.appendChild(p)}
var lim=all?res.length:10;
res.slice(0,lim).forEach(function(r){var it=r.it,a=el("a","sr");a.href=it.href;
a.appendChild(el("span","srt",it.type));var tt=el("span","srn");hl(tt,it.title,re);a.appendChild(tt);
var sn=el("span","srs");hl(sn,snip(it.text,toks),re);a.appendChild(sn);
a.onclick=function(e){if(it.res){e.preventDefault();location.hash="res-"+it.res.id}else if(it.subject){e.preventDefault();q=it.subject.toLowerCase();location.hash="resources";render()}else if(it.faq){e.preventDefault();location.hash="faq";setTimeout(function(){it.faq.open=true;it.faq.scrollIntoView({block:"center"})},90)}};
L.appendChild(a)});
if(res.length>lim){var mb=el("button","chip more","Show all "+res.length+" results");mb.type="button";mb.onclick=function(){showSR(SR.q,false,true)};L.appendChild(mb)}
box.hidden=false;
if(scroll)box.scrollIntoView({behavior:"smooth",block:"start"})}
function refreshSR(){var box=document.getElementById("hsr");if(!box||box.hidden||!SR.q)return;var sig=(items||[]).length+"|"+(posts||[]).length;if(sig!==SR.sig)showSR(SR.q,false)}
function siteSearch(raw){var v=cl(raw);document.getElementById("hq").value=v;document.getElementById("sq").value=v;
if(document.getElementById("home").hidden){location.hash="home";setTimeout(function(){showSR(v,true)},90)}else showSR(v,true)}
document.getElementById("hs").onsubmit=function(e){e.preventDefault();siteSearch(document.getElementById("hq").value);document.getElementById("hq").blur()};
document.getElementById("sf").onsubmit=function(e){e.preventDefault();siteSearch(document.getElementById("sq").value)};
var hqT;document.getElementById("hq").addEventListener("input",function(){var v=this.value;clearTimeout(hqT);hqT=setTimeout(function(){document.getElementById("sq").value=v;if(innerWidth<761)return;if(cl(v).length>=2)showSR(v,false);else if(!cl(v))document.getElementById("hsr").hidden=true},250)});
document.getElementById("hsr-x").onclick=function(){document.getElementById("hsr").hidden=true;SR.q="";document.getElementById("hq").value="";document.getElementById("sq").value="";document.getElementById("hq").focus()};

document.getElementById("rq").oninput=function(){q=this.value.trim().toLowerCase();render()};
function stat(){refreshSR();var f=0,p=0;items.forEach(function(r){if(r.premium)p++;else f++});document.getElementById("stats").textContent=items.length+" resources · "+f+" free · "+p+" premium";var rq=document.getElementById("rq");if(rq&&document.activeElement!==rq)rq.value=q||""}
var editingId=null;
function thumbData(file){return new Promise(function(res,rej){var fr=new FileReader();fr.onload=function(){var im=new Image();im.onload=function(){var w=Math.min(900,im.width),h=Math.round(im.height*w/im.width),c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(im,0,0,w,h);res(c.toDataURL("image/jpeg",0.8))};im.onerror=rej;im.src=fr.result};fr.onerror=rej;fr.readAsDataURL(file)})}
function resetPost(){editingId=null;editBody="";clearFile();["bt","bs","bb","bi"].forEach(function(i){document.getElementById(i).value=""});document.getElementById("bh").textContent="Write a post";document.getElementById("bp").textContent="Publish post";document.getElementById("bx").hidden=true}
var bpb=document.getElementById("bp");if(bpb){bpb.onclick=async function(){var m=document.getElementById("bm"),t=document.getElementById("bt").value.trim(),b=document.getElementById("bb").value.trim(),f=document.getElementById("bi").files[0];
if(!t||(!b&&!pendingHtml)){m.textContent="Add a title, then write the article or upload a file.";return}var bodyTxt=pendingHtml?tx(cleanHtml(pendingHtml)):b;
var rec={title:t,category:document.getElementById("bc").value,summary:document.getElementById("bs").value.trim()||bodyTxt.slice(0,120),body:bodyTxt,html:pendingHtml||""};
try{if(f){if(!/^image\//.test(f.type)){m.textContent="The thumbnail must be an image.";return}rec.thumb=await thumbData(f)}
if(editingId){await db.collection("posts").doc(editingId).update(rec);m.textContent="Saved."}else{rec.createdAt=Date.now();rec.thumb=rec.thumb||"";await db.collection("posts").add(rec);m.textContent="Published."}
resetPost()}catch(e){m.textContent="Could not save. Try again."}};
document.getElementById("bx").onclick=function(){resetPost();document.getElementById("bm").textContent=""};
var bfe=document.getElementById("bf");if(bfe){bfe.onchange=async function(){var m=document.getElementById("bm"),f=this.files[0];if(!f)return;m.textContent="Reading the file…";
try{var r=await readArticle(f);pendingHtml=r.html;var bt=document.getElementById("bt"),bs=document.getElementById("bs");if(!bt.value.trim())bt.value=r.title;if(!bs.value.trim())bs.value=r.desc;
showImported(r.html,"Using the content of “"+f.name+"” (about "+r.words+" words). Check the preview, then press Publish."+(r.imgs?" Pictures inside the file are not imported, so add a thumbnail image above.":""));m.textContent=""}
catch(e){var x=this;pendingHtml="";x.value="";m.textContent=e.message==="type"?"Please choose a .docx or .html file.":e.message==="size"?"That file is too large (limit 8 MB).":e.message==="big"?"That article is too long to store. Split it into two posts.":e.message==="empty"?"No text was found in that file.":e.message==="lib"?"Could not load the Word reader. Check your internet connection and try again.":"Could not read that file. Try saving it again as .docx or .html."}}}
document.getElementById("bfc").onclick=function(){var keep=editBody;clearFile();if(editingId&&keep)document.getElementById("bb").value=keep}}
function renderPlist(){var P=document.getElementById("plist");if(!P)return;P.textContent="";if(!posts.length)P.appendChild(el("p","","No posts yet."));
posts.forEach(function(p){var row=el("div","card");row.style.marginTop="10px";row.appendChild(el("h3","",p.title));row.appendChild(el("p","",(p.category||"")+" \u00b7 "+new Date(p.createdAt||0).toLocaleDateString()));var b=el("div","row"),ed=el("button","chip","Edit"),dx=el("button","chip","Delete");
ed.onclick=function(){editingId=p.id;document.getElementById("bt").value=p.title;document.getElementById("bc").value=p.category;document.getElementById("bs").value=p.summary||"";clearFile();editBody=p.body||"";var bcs=document.getElementById("bc");if(p.category&&![].some.call(bcs.options,function(o){return o.value===p.category})){var oo=document.createElement("option");oo.textContent=p.category;bcs.appendChild(oo);bcs.value=p.category}document.getElementById("bb").value=p.body||"";if(p.html){pendingHtml=p.html;showImported(p.html,"This post uses content imported from a file. Choose a new file to replace it, or remove it to write the article here.")}document.getElementById("bh").textContent="Edit post";document.getElementById("bp").textContent="Save changes";document.getElementById("bx").hidden=false;document.getElementById("bt").scrollIntoView()};
dx.onclick=async function(){if(!dx.dataset.sure){dx.dataset.sure="1";dx.textContent="Click again to confirm";setTimeout(function(){dx.dataset.sure="";dx.textContent="Delete"},4000);return}try{await db.collection("posts").doc(p.id).delete();posts=posts.filter(function(x){return x.id!==p.id});renderPosts()}catch(e){dx.textContent="Could not delete"}};
b.appendChild(ed);b.appendChild(dx);row.appendChild(b);P.appendChild(row)})}
function buildPE(){var C=document.getElementById("petext");if(!C||C.dataset.built)return;C.dataset.built="1";
document.querySelectorAll("[data-k]").forEach(function(n){var l=el("label","",n.getAttribute("data-l")||n.getAttribute("data-k"));l.style.marginTop="12px";var ta=document.createElement("textarea");ta.rows=3;ta.value=n.textContent.trim();ta.dataset.k=n.getAttribute("data-k");l.appendChild(ta);C.appendChild(l)})}
var pesv=document.getElementById("pesave");if(pesv){pesv.onclick=async function(){var m=document.getElementById("pem");m.textContent="Saving\u2026";try{var tas=document.querySelectorAll("#petext textarea");for(var i=0;i<tas.length;i++){var k=tas[i].dataset.k,v=tas[i].value.trim(),n=document.querySelector('[data-k="'+k+'"]');if(v&&n&&n.textContent.trim()!==v){await db.collection("pagetext").doc("pt_"+k).set({key:k,text:v});n.textContent=v}}m.textContent="Saved."}catch(e){m.textContent="Could not save. Try again."}}}
var mtb=document.getElementById("mt"),nv=document.getElementById("nav");
function syncAuth(){var si=document.getElementById("signin"),su=document.getElementById("signup"),a=document.querySelector('.auth a[href="#dashboard"]');document.getElementById("msi").textContent=si.textContent;document.getElementById("msu").hidden=su.hidden;document.getElementById("mad").hidden=!a}
document.getElementById("msi").onclick=function(){nv.classList.remove("open");document.getElementById("signin").click()};
document.getElementById("msu").onclick=function(){nv.classList.remove("open");document.getElementById("signup").click()};mtb.onclick=function(){syncAuth();var o=nv.classList.toggle("open");mtb.setAttribute("aria-expanded",o?"true":"false");mtb.setAttribute("aria-label",o?"Close menu":"Open menu")};
addEventListener("hashchange",function(){nv.classList.remove("open");mtb.setAttribute("aria-expanded","false")});
function payPal(r){var f=document.createElement("form");f.method="post";f.action="https://www.paypal.com/cgi-bin/webscr";f.target="_blank";f.rel="noopener";f.style.display="none";var F={cmd:"_s-xclick",hosted_button_id:"PKQP4Q6EZ8NDU",currency_code:"USD",custom:r.id+"|"+meEmail};Object.keys(F).forEach(function(k){var i=document.createElement("input");i.type="hidden";i.name=k;i.value=F[k];f.appendChild(i)});document.body.appendChild(f);f.submit();f.remove()}
async function buyItem(r){var m=document.getElementById("msg");m.textContent="";if(!memb){document.getElementById("signin").click();return}
try{if(ords[r.id]!=="pending"){await db.collection("orders").add({resourceId:r.id,title:r.title,email:meEmail,userId:meId,status:"pending",createdAt:Date.now()});ords[r.id]="pending";render()}
payPal(r);toast("PayPal has opened in a new tab. After you pay, we unlock this guide for your account, usually within a day.");m.appendChild(el("div","msg","PayPal has opened in a new tab. After you pay, we unlock this guide for your account, usually within a day. Please pay with the same email as your account, or tell us on the Contact page."))}catch(e){m.appendChild(el("div","msg","Sorry, we could not start the order. Please try again."));toast("Sorry, we could not start the order. Please try again.")}}
function renderOrders(){var O=document.getElementById("orders");if(!O)return;O.textContent="";var pl=orders.filter(function(o){return o.status==="pending"});if(!pl.length){O.appendChild(el("p","","No pending premium orders."));return}
pl.forEach(function(o){var c=el("div","card");c.style.marginTop="10px";c.appendChild(el("h3","",o.title));c.appendChild(el("p","",o.email+" \u00b7 "+new Date(o.createdAt||0).toLocaleString()));var row=el("div","row"),ok=el("button","btn","Unlock"),no=el("button","chip","Dismiss");
ok.onclick=async function(){try{await db.collection("entitlements").doc("e_"+o.userId+"_"+o.resourceId).set({userId:o.userId,resourceId:o.resourceId,title:o.title,email:o.email,createdAt:Date.now()});await db.collection("orders").doc(o.id).update({status:"approved"});o.status="approved";renderOrders()}catch(e){ok.textContent="Could not unlock"}};
no.onclick=async function(){if(!no.dataset.sure){no.dataset.sure="1";no.textContent="Click again to confirm";setTimeout(function(){no.dataset.sure="";no.textContent="Dismiss"},4000);return}try{await db.collection("orders").doc(o.id).delete();o.status="dismissed";renderOrders()}catch(e){no.textContent="Could not dismiss"}};
row.appendChild(ok);row.appendChild(no);c.appendChild(row);O.appendChild(c)})}
function toast(t){var d=document.getElementById("toast");if(!d){d=document.createElement("div");d.id="toast";d.setAttribute("role","status");d.style.cssText="position:fixed;left:50%;transform:translateX(-50%);bottom:24px;background:var(--ink);color:var(--bg);padding:12px 18px;border-radius:10px;z-index:200;font-size:14px;max-width:90vw;box-shadow:0 8px 24px rgba(0,0,0,.25)";document.body.appendChild(d)}d.textContent=t;d.hidden=false;clearTimeout(d._t);d._t=setTimeout(function(){d.hidden=true},4500)}
function openRes(r){location.hash="res-"+r.id}
function tocGo(art,a){var id=(a.getAttribute("href")||"").slice(1),t=document.getElementById("art-"+id);
if(!t){var tx=cl(a.textContent).toLowerCase().replace(/[\s.\u2026]*\d+\s*$/,"").replace(/^[\d.)\s]+/,"");if(tx){art.querySelectorAll("h1,h2,h3,h4,h5").forEach(function(h){if(t)return;var ht=cl(h.textContent).toLowerCase().replace(/^[\d.)\s]+/,"");if(ht&&(ht===tx||(ht.length>3&&(ht.indexOf(tx)===0||tx.indexOf(ht)===0))))t=h})}}
if(t){t=t.closest("h1,h2,h3,h4,h5")||t;t.scrollIntoView({behavior:"smooth",block:"start"})}}
function renderRes(id){var V=document.getElementById("resView");if(!V)return;V.textContent="";var r=null;items.forEach(function(x){if(x.id===id)r=x});
var back=el("a","btn alt","\u2190 Back to resources");back.href="#resources";
if(!r){V.appendChild(el("h1","",loaded&&items.length?"File not found":"Loading\u2026"));V.appendChild(back);return}
document.title=r.title+" | Academicstrata";var lk=r.premium&&!canPrem&&!ents[r.id];
V.appendChild(el("span",r.premium?"prem":"free",r.premium?"Premium \u00b7 $1":"Free"));
var h=el("h1","",r.title);h.style.marginTop="12px";V.appendChild(h);
if(r.description)V.appendChild(el("p","",r.description));
var T=document.createElement("table");T.className="rtab";
[["Subject",r.subject||"\u2014"],["Type",r.category||"Not set"],["Format",((r.assetId||"").split(".").pop()||"file").toUpperCase()],["Size",r.size?fsz(r.size):"Not available"],["Added",r.createdAt?new Date(r.createdAt).toLocaleDateString():"\u2014"],["Access",r.premium?"Premium, $1 (paid with PayPal)":"Free"],["Downloads",String(dcounts[r.id]||0)]].forEach(function(x){var tr=T.insertRow(),th=document.createElement("th");th.textContent=x[0];th.scope="row";tr.appendChild(th);tr.insertCell().textContent=x[1]});
V.appendChild(T);var row=el("div","row");row.style.margin="20px 0 12px";
if(lk){var b=el("button","btn",memb?"Pay $1 with PayPal":"Sign in to buy ($1)");b.onclick=function(){buyItem(r)};row.appendChild(b)}
else{var d1=el("button","btn","Download");d1.onclick=function(){dl(r,false)};row.appendChild(d1);if(!isEditor){var d2=el("button","btn alt","Open in new tab");d2.onclick=function(){dl(r,true)};row.appendChild(d2)}}
var cp=el("button","chip","Copy link");cp.onclick=function(){var u=location.href;if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(u).then(function(){toast("Link copied")}).catch(function(){toast(u)})}else toast(u)};row.appendChild(cp);V.appendChild(row);
if(lk&&ords[r.id]==="pending"){var pn=el("p","","Payment pending. We unlock this guide once PayPal confirms your payment.");pn.style.fontSize="14px";V.appendChild(pn)}
var bk=el("div","");bk.style.marginTop="16px";bk.appendChild(back);V.appendChild(bk)}
var q="";

var dlg=document.getElementById("dlg");
function openAuth(n){var up=n==="Sign Up",rec=n==="Set a new password";document.getElementById("dt").textContent=n;document.getElementById("dm").textContent="";document.getElementById("del").hidden=rec;document.getElementById("dgb").hidden=rec;document.getElementById("dfp").parentNode.hidden=n!=="Sign In";document.getElementById("dpt").textContent=rec?"New password (10+ characters, letters and numbers)":up?"Password (10+ characters, letters and numbers)":"Password";document.getElementById("dp").autocomplete=(up||rec)?"new-password":"current-password";document.getElementById("dp").value="";dlg.showModal()}
document.getElementById("signin").onclick=function(){openAuth("Sign In")};
document.getElementById("signup").onclick=function(){openAuth("Sign Up")};
document.getElementById("dx").onclick=function(){dlg.close()};
["de","dp"].forEach(function(i){document.getElementById(i).addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();document.getElementById("dgo").click()}})});
function strongPw(p){return p.length>=10&&/[A-Za-z]/.test(p)&&/\d/.test(p)}
document.getElementById("dgo").onclick=async function(){var m=document.getElementById("dm"),t=document.getElementById("dt").textContent,em=document.getElementById("de").value.trim(),pw=document.getElementById("dp").value;
if(t==="Set a new password"){if(!strongPw(pw)){m.textContent="Use at least 10 characters, with letters and numbers.";return}m.textContent="Please wait\u2026";try{await SS.setPassword(pw);m.textContent="Password changed. Reloading\u2026";setTimeout(function(){location.href=location.pathname+"#home";location.reload()},1200)}catch(e){m.textContent=e.message||"Could not change the password. Please request a new link."}return}
var up=t==="Sign Up";if(!/^\S+@\S+\.\S+$/.test(em)||!pw){m.textContent="Enter a valid email and your password.";return}
if(up&&!strongPw(pw)){m.textContent="Use at least 10 characters, with letters and numbers.";return}
m.textContent="Please wait\u2026";try{var r=await (up?SS.signUp(em,pw):SS.signIn(em,pw));if(r&&r.confirm){m.textContent="Account created. Check your email to confirm it, then sign in."}else{location.reload()}}catch(e){m.textContent=e.message||"Something went wrong. Try again."}};
document.getElementById("dgoogle").onclick=async function(){var m=document.getElementById("dm");m.textContent="Opening Google\u2026";var slow=setTimeout(function(){m.textContent="Still waiting. If nothing happens, Google sign-in may not be switched on yet in Supabase. You can use your email and password instead."},8000);try{await SS.google()}catch(e){clearTimeout(slow);m.textContent="Google sign-in is not switched on yet. Please use your email and password."}};
(function(){var hs=location.hash||"",mm=hs.match(/error_description=([^&]+)/);if(mm){var msg="";try{msg=decodeURIComponent(mm[1].replace(/\+/g," "))}catch(e){msg="Sign-in was not completed."}history.replaceState(null,"",location.pathname+"#home");openAuth("Sign In");document.getElementById("dm").textContent="Sign-in problem: "+msg}})();
document.getElementById("dfp").onclick=async function(){var m=document.getElementById("dm"),em=document.getElementById("de").value.trim();if(!/^\S+@\S+\.\S+$/.test(em)){m.textContent="Type your email above first.";return}m.textContent="Please wait\u2026";try{await SS.reset(em)}catch(e){}m.textContent="If an account exists for that email, a reset link has been sent. The link expires soon, so use it right away."};
window.addEventListener("pwrecovery",function(){openAuth("Set a new password")});if(window.__pwrec)openAuth("Set a new password");
var skp=document.querySelector(".skip");if(skp)skp.addEventListener("click",function(e){var mn=document.getElementById("main");if(mn){e.preventDefault();mn.setAttribute("tabindex","-1");mn.focus()}});

document.getElementById("up").onclick=async function(){
var m=document.getElementById("upmsg"),f=document.getElementById("f").files[0],t=document.getElementById("t").value.trim();
if(!db||!assets){m.textContent="Please sign in to upload.";return}
if(!t||!f){m.textContent="Add a title and choose a PDF.";return}
if(!/\.(pdf|docx)$/i.test(f.name)){m.textContent="Only PDF and Word (.docx) files are accepted.";return}
if(f.size>20971520){m.textContent="File is too large (20 MB maximum).";return}
m.textContent="Uploading…";
try{var a=await assets.upload(f);
var rec={title:t,subject:document.getElementById("s").value,category:document.getElementById("rc").value,description:document.getElementById("rdsc").value.trim(),premium:isEditor&&document.getElementById("p").checked,assetId:a.id,url:a.url,size:a.sizeBytes,createdAt:Date.now(),verified:isEditor};
if(isEditor){await db.collection("resources").add(rec);m.textContent="Published."}else{await db.collection("submissions").add(rec);m.textContent="Thank you. Your file was sent for review and will appear once an admin approves it."}document.getElementById("t").value="";document.getElementById("f").value="";
}catch(e){m.textContent="Upload failed. Try again."}};
