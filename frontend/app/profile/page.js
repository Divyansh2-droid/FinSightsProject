"use client";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // edit panel state
  const [showEdit, setShowEdit] = useState(false);

  // editable fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Load user
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    axios
      .get("http://localhost:5000/api/user/me", {
        headers: { "x-auth-token": token },
      })
      .then((res) => setUser(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  // Open edit → prefill form
  const openEdit = () => {
    if (!user) return;
    setName(user.name || "");
    setUsername(user.username || "");
    setBio(user.bio || "");
    setAvatarPreview(user.avatarUrl || null);
    setAvatarFile(null);
    setShowEdit(true);
  };

  const closeEdit = () => {
    setShowEdit(false);
    setAvatarFile(null);
  };

  // Avatar handlers
  const onChooseAvatar = () => fileInputRef.current?.click();
  const onAvatarChange = (e) => {
    const file = e?.target?.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };
  const clearAvatar = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  // Save edits
  const handleSaveProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setSaving(true);

      // 1) Save basic fields
      const { data: updated } = await axios.patch(
        "http://localhost:5000/api/user/me",
        { name, username, bio },
        { headers: { "x-auth-token": token } }
      );

      // 2) Upload avatar if selected
      if (avatarFile) {
        setUploading(true);
        const formData = new FormData();
        formData.append("avatar", avatarFile);

        const { data: avatarRes } = await axios.post(
          "http://localhost:5000/api/user/avatar",
          formData,
          {
            headers: {
              "x-auth-token": token,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        updated.avatarUrl = avatarRes?.avatarUrl || updated.avatarUrl;
      }

      setUser((u) => ({ ...(u || {}), ...updated }));
      closeEdit();
    } catch (err) {
      console.error("Save profile failed:", err);
      alert(err?.response?.data?.error || "Failed to save profile");
    } finally {
      setUploading(false);
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  const initials = (user?.name || user?.email || "U")
    .split(/[.\s_-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");

  const joined = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : "—";

  return (
    <div
      className="relative min-h-dvh text-white"
      style={{
        backgroundImage: "url('https://4kwallpapers.com/images/walls/thumbs_3t/13833.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* overlay for readability on small screens */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/65 sm:from-black/35" />

      <Navbar user={user} handleLogout={handleLogout} />

      <div className="relative z-10 pt-20 sm:pt-24 mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-400 mb-6 sm:mb-8 drop-shadow">
          👤 My Profile
        </h1>

        {loading ? (
          <p className="text-gray-300">Loading…</p>
        ) : !user ? (
          <p className="text-gray-400">Please login to see your profile.</p>
        ) : (
          <>
            {/* Overview card */}
            <section className="rounded-2xl border border-white/10 bg-black/40 p-4 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 sm:gap-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/10 ring-1 ring-white/10 overflow-hidden grid place-items-center">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="avatar"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xl sm:text-2xl font-bold text-white/80">
                        {initials}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-bold">
                      {user.name || "Unnamed"}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-400 break-all">
                      {user.email}
                    </div>
                    {user.username && (
                      <div className="mt-1 text-xs sm:text-sm text-gray-400">
                        @{user.username}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm min-w-0 w-full md:w-auto md:min-w-[260px]">
                  <div className="rounded-lg bg-white/5 p-3">
                    <div className="text-gray-400">User ID</div>
                    <div className="truncate">{user._id}</div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3">
                    <div className="text-gray-400">Joined</div>
                    <div>{joined}</div>
                  </div>
                </div>
              </div>

              {user.bio && (
                <p className="mt-4 text-sm sm:text-base text-gray-300 whitespace-pre-line">
                  {user.bio}
                </p>
              )}

              <div className="mt-5 sm:mt-6">
                <button
                  onClick={openEdit}
                  className="min-h-10 rounded-lg bg-blue-600 px-4 py-2 font-semibold shadow hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                >
                  Edit Profile
                </button>
              </div>
            </section>

            {/* Slide-over Edit Panel */}
            <EditPanel
              open={showEdit}
              onClose={closeEdit}
              name={name}
              setName={setName}
              username={username}
              setUsername={setUsername}
              bio={bio}
              setBio={setBio}
              avatarPreview={avatarPreview}
              onChooseAvatar={onChooseAvatar}
              onAvatarChange={onAvatarChange}
              clearAvatar={clearAvatar}
              fileInputRef={fileInputRef}
              onSave={handleSaveProfile}
              saving={saving}
              uploading={uploading}
            />
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- Slide-over Component ---------------- */

function EditPanel(props) {
  const {
    open,
    onClose,
    name,
    setName,
    username,
    setUsername,
    bio,
    setBio,
    avatarPreview,
    onChooseAvatar,
    onAvatarChange,
    clearAvatar,
    fileInputRef,
    onSave,
    saving,
    uploading,
  } = props;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
      />
      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md transform bg-neutral-900 shadow-2xl transition-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h3 className="text-base sm:text-lg font-semibold">Edit Profile</h3>
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm ring-1 ring-white/15 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 p-5">
          {/* Avatar */}
          <div>
            <label className="mb-1 block text-sm text-gray-400">Avatar</label>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-full ring-1 ring-white/10">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center bg-white/5 text-xs text-gray-400">
                    No image
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={onChooseAvatar}
                  className="min-h-10 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold shadow hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
                >
                  Choose
                </button>
                <button
                  onClick={clearAvatar}
                  className="min-h-10 rounded-lg px-3 py-1.5 text-sm ring-1 ring-white/15 hover:bg-white/5"
                >
                  Clear
                </button>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onAvatarChange}
            />
          </div>

          {/* Name */}
          <div>
            <label className="mb-1 block text-sm text-gray-400">Display Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              className="w-full rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Username */}
          <div>
            <label className="mb-1 block text-sm text-gray-400">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="unique-handle"
              className="w-full rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">3–20 chars, letters/numbers/_/-</p>
          </div>

          {/* Bio */}
          <div>
            <label className="mb-1 block text-sm text-gray-400">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              placeholder="Tell something about yourself…"
              className="w-full rounded-lg bg-white/5 px-3 py-2 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 border-t border-white/10 px-5 py-4">
          <button
            onClick={onClose}
            className="min-h-10 rounded-lg px-4 py-2 font-semibold ring-1 ring-white/15 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving || uploading}
            className="min-h-10 rounded-lg bg-blue-600 px-4 py-2 font-semibold shadow hover:bg-blue-700 disabled:opacity-60"
          >
            {saving || uploading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </aside>
    </>
  );
}
