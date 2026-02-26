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
    <div className="max-w-4xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Manage Resources</h2>

      {/* Add / Edit Form */}
      <div className="bg-white p-6 rounded-xl border space-y-4">
        <input
          name="name"
          placeholder="Resource Name"
          value={form.name}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        />

        <select
          name="type"
          value={form.type}
          onChange={handleChange}
          className="w-full border p-2 rounded"
        >
          <option value="Lab">Lab</option>
          <option value="Hall">Hall</option>
        </select>

        <select
          name="department"
          value={form.department}
          onChange={handleChange}
          className="w-full border p-2 rounded bg-white"
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
          className="w-full border p-2 rounded"
        />

        <button
          onClick={handleAddOrUpdate}
          className="bg-zinc-900 text-white px-6 py-2 rounded"
        >
          {editingId ? "Update Resource" : "Add Resource"}
        </button>
      </div>

      {/* Resource List */}
      <div className="grid gap-4">
        {resources.map((res) => (
          <div
            key={res.id}
            className="flex justify-between items-center border p-4 rounded-lg"
          >
            <div>
              <p className="font-bold">{res.name}</p>
              <p className="text-sm text-zinc-500">
                {res.type} • {res.department} • {res.capacity} seats
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(res)}
                className="px-3 py-1 bg-amber-100 rounded"
              >
                Edit
              </button>

              <button
                onClick={() => handleDelete(res.id)}
                className="px-3 py-1 bg-red-100 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminResources;
