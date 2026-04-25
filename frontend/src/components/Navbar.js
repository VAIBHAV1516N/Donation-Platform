import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function NavigationBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    try { const raw = localStorage.getItem("user"); return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  });
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onStorage = () => {
      setToken(localStorage.getItem("token"));
      try { const raw = localStorage.getItem("user"); setUser(raw ? JSON.parse(raw) : null); }
      catch { setUser(null); }
    };
    const onUserChanged = (e) => {
      if (e?.detail) { setUser(e.detail); setToken(localStorage.getItem("token")); }
      else onStorage();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("userChanged", onUserChanged);
    return () => { window.removeEventListener("storage", onStorage); window.removeEventListener("userChanged", onUserChanged); };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token"); localStorage.removeItem("user");
    setToken(null); setUser(null); setMenuOpen(false);
    window.dispatchEvent(new CustomEvent("userChanged", { detail: null }));
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const publicLinks = [
    { to: "/", label: "Home" },
    { to: "/charities", label: "Charities" },
    { to: "/donations", label: "Donations" },
    { to: "/contact-us", label: "Add Charity" },
  ];
  const authLinks = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/profile", label: "Profile" },
  ];

  return (
    <nav className="navbar-givehub">
      <div style={{ maxWidth:1180,margin:"0 auto",padding:"0 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",gap:"1.5rem" }}>
        <Link to="/" style={{ textDecoration:"none",display:"flex",alignItems:"center",gap:10 }}>
          <span className="brand-heart">♥</span>
          <span style={{ fontFamily:"var(--font-display)",fontWeight:700,fontSize:"1.55rem",color:"white",letterSpacing:"-0.03em" }}>
            Give<span style={{ color:"var(--amber)" }}>Hub</span>
          </span>
        </Link>

        <div style={{ display:"flex",alignItems:"center",gap:"0.25rem",flex:1,justifyContent:"center" }} className="d-none d-lg-flex">
          {publicLinks.map(l => (
            <Link key={l.to} to={l.to} className={`navbar-givehub nav-link${isActive(l.to)?" active":""}`} style={{ textDecoration:"none" }}>{l.label}</Link>
          ))}
          {token && authLinks.map(l => (
            <Link key={l.to} to={l.to} className={`navbar-givehub nav-link${isActive(l.to)?" active":""}`} style={{ textDecoration:"none" }}>{l.label}</Link>
          ))}
          {token && user?.isAdmin && (
            <Link to="/admin" className={`navbar-givehub nav-link${isActive("/admin")?" active":""}`} style={{ textDecoration:"none" }}>Admin</Link>
          )}
        </div>

        <div style={{ display:"flex",alignItems:"center",gap:"0.6rem" }} className="d-none d-lg-flex">
          <Link to="/charities" className="btn-nav-donate" style={{ textDecoration:"none" }}>Donate Now</Link>
          {!token ? (
            <>
              <Link to="/login" className="btn-nav-outline" style={{ textDecoration:"none" }}>Sign In</Link>
              <Link to="/register" className="btn-nav-outline" style={{ textDecoration:"none" }}>Sign Up</Link>
            </>
          ) : (
            <>
              <span style={{ color:"rgba(255,255,255,.6)",fontSize:"0.85rem",whiteSpace:"nowrap" }}>Hi, {user?.name?.split(" ")[0]||"User"}</span>
              <button onClick={handleLogout} className="btn-nav-outline" style={{ cursor:"pointer" }}>Log Out</button>
            </>
          )}
        </div>

        <button onClick={() => setMenuOpen(!menuOpen)} className="d-lg-none"
          style={{ background:"none",border:"1.5px solid rgba(255,255,255,.25)",borderRadius:8,padding:"0.5rem 0.75rem",color:"white",cursor:"pointer",fontSize:"1.1rem" }}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>

      {menuOpen && (
        <div style={{ background:"#111",borderTop:"1px solid rgba(255,255,255,.1)",padding:"1rem 1.5rem 1.5rem" }} className="d-lg-none">
          {[...publicLinks,...(token?authLinks:[{to:"/login",label:"Sign In"},{to:"/register",label:"Sign Up"}]),...(token&&user?.isAdmin?[{to:"/admin",label:"Admin"}]:[])].map(l => (
            <Link key={l.to} to={l.to} onClick={()=>setMenuOpen(false)}
              style={{ display:"block",color:"rgba(255,255,255,.75)",textDecoration:"none",padding:"0.65rem 0",fontWeight:500,borderBottom:"1px solid rgba(255,255,255,.07)" }}>
              {l.label}
            </Link>
          ))}
          {token && <button onClick={handleLogout} style={{ marginTop:"1rem",background:"none",border:"1px solid rgba(255,255,255,.2)",color:"rgba(255,255,255,.7)",borderRadius:8,padding:"0.6rem 1.25rem",cursor:"pointer",width:"100%",fontFamily:"var(--font-body)" }}>Log Out</button>}
          <Link to="/charities" onClick={()=>setMenuOpen(false)}
            style={{ display:"block",marginTop:"0.75rem",background:"var(--amber)",color:"var(--ink)",textAlign:"center",padding:"0.8rem",borderRadius:8,fontWeight:700,textDecoration:"none" }}>
            Donate Now
          </Link>
        </div>
      )}
    </nav>
  );
}

export default NavigationBar;
