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
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Manage Approvers</h1>

      {/* Form */}
      <div className="bg-white border rounded-xl p-6 space-y-4">
        <input
          name="email"
          placeholder="User Email"
          value={form.email}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full border p-2 rounded"
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
            className="w-full border p-2 rounded"
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
            className="w-full border p-2 rounded"
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
          className="bg-zinc-900 text-white px-6 py-2 rounded"
        >
          Add / Update Approver
        </button>
      </div>

      {/* List */}
      <div className="space-y-3">
        {approvers.map((a) => (
          <div
            key={a.id}
            className="border p-4 rounded-lg flex justify-between items-center"
          >
            <div>
              <p className="font-bold">{a.email}</p>
              <p className="text-sm text-zinc-500">
                Role: {a.role}
                {a.department && ` • Dept: ${a.department}`}
                {a.resourceId && ` • Resource: ${a.resourceId}`}
              </p>
            </div>

            <button
              onClick={() => handleDelete(a.id)}
              className="px-3 py-1 bg-red-100 rounded"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminApprovers;
