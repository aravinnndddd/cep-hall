import React, { useEffect, useState } from "react";
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";

const SUPER_ADMIN = "admin@college.edu";

const departments = [
  "Computer Science",
  "Electrical",
  "Electronics",
  "Mechanical",
  "Administration",
  "Skill Development",
];

const AdminApprovers: React.FC = () => {
  const { user, resources } = useAuth();

  const [approvers, setApprovers] = useState<any[]>([]);
  const [form, setForm] = useState({
    email: "",
    role: "hod",
    department: "",
    resourceId: "",
    isActive: true,
  });

  // Block non-super-admin
  if (user?.email !== SUPER_ADMIN) {
    return (
      <div className="text-center py-20 text-red-600 font-bold">
        Access Denied
      </div>
    );
  }

  // Real-time fetch
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "authorizedApprovers"),
      (snap) => {
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setApprovers(list);
      },
    );

    return unsubscribe;
  }, []);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!form.email) return;

    const data: any = {
      email: form.email,
      role: form.role,
      isActive: true,
    };

    if (form.role === "hod") data.department = form.department;
    if (form.role === "staff") data.resourceId = form.resourceId;

    await setDoc(doc(db, "authorizedApprovers", form.email), data);

    setForm({
      email: "",
      role: "hod",
      department: "",
      resourceId: "",
      isActive: true,
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Remove this approver?")) return;
    await deleteDoc(doc(db, "authorizedApprovers", id));
  };

  return (
    <div className="min-h-screen ">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-zinc-800 tracking-tight">
            Manage Approvers
          </h1>
        </div>

        {/* Form Card */}
        <div className="bg-white/70 backdrop-blur-md shadow-xl rounded-2xl p-8 space-y-5 border border-zinc-200">
          <h3 className="text-lg font-semibold text-zinc-700">
            Add / Update Approver
          </h3>

          <input
            name="email"
            placeholder="User Email"
            value={form.email}
            onChange={handleChange}
            className="w-full border border-zinc-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition"
          />

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border border-zinc-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition bg-white"
          >
            <option value="hod">HOD</option>
            <option value="staff">Staff</option>
            <option value="principal">Principal</option>
          </select>

          {form.role === "hod" && (
            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              className="w-full border border-zinc-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition bg-white"
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          )}

          {form.role === "staff" && (
            <select
              name="resourceId"
              value={form.resourceId}
              onChange={handleChange}
              className="w-full border border-zinc-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 transition bg-white"
            >
              <option value="">Select Resource</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={handleSave}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-3 rounded-xl font-medium shadow-md transition-all duration-300 hover:scale-[1.02]"
          >
            Save Approver
          </button>
        </div>

        {/* Approver List */}
        <div className="grid gap-4">
          {approvers.map((a) => (
            <div
              key={a.id}
              className="bg-white shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl p-6 flex justify-between items-center border border-zinc-200"
            >
              <div>
                <p className="text-lg font-semibold text-zinc-800">{a.email}</p>

                <div className="flex items-center gap-2 mt-2 text-sm">
                  <span className="px-3 py-1 rounded-full bg-zinc-200 text-zinc-700 capitalize">
                    {a.role}
                  </span>

                  {a.department && (
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                      {a.department}
                    </span>
                  )}

                  {a.resourceId && (
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      Resource Assigned
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => handleDelete(a.id)}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminApprovers;
