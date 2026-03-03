import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Resource } from "../types";

const AdminResources: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [form, setForm] = useState({
    name: "",
    type: "Lab",
    department: "",
    capacity: "",
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const departments = [
    "Computer Science",
    "Electrical",
    "Electronics",
    "Mechanical",
    "Administration",
  ];
  // Real-time fetch
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "resources"), (snap) => {
      const list = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Resource,
      );
      setResources(list);
    });

    return unsubscribe;
  }, []);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddOrUpdate = async () => {
    if (!form.name || !form.department || !form.capacity) return;

    const data = {
      name: form.name,
      type: form.type,
      department: form.department,
      capacity: Number(form.capacity),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "resources", editingId), data);
        setEditingId(null);
      } else {
        await addDoc(collection(db, "resources"), data);
      }

      setForm({
        name: "",
        type: "Lab",
        department: "",
        capacity: "",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (res: Resource) => {
    setForm({
      name: res.name,
      type: res.type,
      department: res.department,
      capacity: res.capacity.toString(),
    });
    setEditingId(res.id);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this resource?")) return;
    await deleteDoc(doc(db, "resources", id));
  };

  return (
    <div className="min-h-screen ">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold text-zinc-800 tracking-tight">
            Manage Resources
          </h2>
        </div>

        {/* Add / Edit Form */}
        <div className="bg-white/70 backdrop-blur-md shadow-xl rounded-2xl p-8 space-y-5 border border-zinc-200">
          <h3 className="text-lg font-semibold text-zinc-700">
            {editingId ? "Update Resource" : "Add New Resource"}
          </h3>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              name="name"
              placeholder="Resource Name"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-zinc-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-800 transition"
            />

            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full border border-zinc-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-800 transition bg-white"
            >
              <option value="Lab">Lab</option>
              <option value="Hall">Hall</option>
            </select>

            <select
              name="department"
              value={form.department}
              onChange={handleChange}
              className="w-full border border-zinc-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-800 transition bg-white"
            >
              <option value="">Select Department</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <input
              name="capacity"
              type="number"
              placeholder="Capacity"
              value={form.capacity}
              onChange={handleChange}
              className="w-full border border-zinc-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-800 transition"
            />
          </div>

          <button
            onClick={handleAddOrUpdate}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white py-3 rounded-xl font-medium shadow-md transition-all duration-300 hover:scale-[1.02]"
          >
            {editingId ? "Update Resource" : "Add Resource"}
          </button>
        </div>

        {/* Resource List */}
        <div className="grid gap-4">
          {resources.map((res) => (
            <div
              key={res.id}
              className="bg-white shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl p-6 flex justify-between items-center border border-zinc-200"
            >
              <div>
                <p className="text-lg font-semibold text-zinc-800">
                  {res.name}
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  {res.type} • {res.department} • {res.capacity} seats
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleEdit(res)}
                  className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition"
                >
                  Edit
                </button>

                <button
                  onClick={() => handleDelete(res.id)}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminResources;
