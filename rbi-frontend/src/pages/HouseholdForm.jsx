import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const SEX_OPTIONS = ['Male', 'Female', 'Other'];
const CIVIL_OPTIONS = ['Single', 'Married', 'Widowed', 'Separated', 'Annulled', 'Common Law', 'Unknown'];

const emptyInhabitant = () => ({
  lastName: '',
  firstName: '',
  middleName: '',
  nameExtension: '',
  placeOfBirth: '',
  dateOfBirth: '',
  age: '',
  sex: '',
  civilStatus: '',
  citizenship: '',
  occupation: '',
  isLaborEmployed: false,
  isUnemployed: false,
  isPWD: false,
  isOFW: false,
  isSoloParent: false,
  isOSY: false,
  isOSC: false,
  isIP: false,
});

function calcAge(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

export default function HouseholdForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);
  const isStaff = ['encoder', 'secretary', 'punong_barangay'].includes(user?.role);

  const [form, setForm] = useState({
    region: '',
    province: '',
    cityMunicipality: '',
    barangay: '',
    householdAddress: '',
    householdNumber: '',
    inhabitants: [emptyInhabitant()],
    dataSource: user?.role === 'resident' ? 'self-entered' : 'staff-assisted',
  });
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) {
      if (user?.barangay) setForm((f) => ({ ...f, barangay: user.barangay, cityMunicipality: user.cityMunicipality, province: user.province, region: user.region }));
      return;
    }
    client.get(`/households/${id}`)
      .then((res) => {
        const h = res.data;
        setForm({
          region: h.region || '',
          province: h.province || '',
          cityMunicipality: h.cityMunicipality || '',
          barangay: h.barangay || '',
          householdAddress: h.householdAddress || '',
          householdNumber: h.householdNumber || '',
          inhabitants: (h.inhabitants?.length ? h.inhabitants.map((i) => ({
            ...emptyInhabitant(),
            ...i,
            dateOfBirth: i.dateOfBirth ? (i.dateOfBirth.slice ? i.dateOfBirth.slice(0, 10) : new Date(i.dateOfBirth).toISOString().slice(0, 10)) : '',
            age: i.age ?? '',
          })) : [emptyInhabitant()]),
          dataSource: h.dataSource || (user?.role === 'resident' ? 'self-entered' : 'staff-assisted'),
        });
      })
      .catch(() => setForm((f) => ({ ...f })))
      .finally(() => setFetchLoading(false));
  }, [id, isEdit]);

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const updateInhabitant = (index, field, value) => {
    setForm((f) => {
      const next = [...(f.inhabitants || [])];
      next[index] = { ...next[index], [field]: value };
      if (field === 'dateOfBirth') next[index].age = calcAge(value);
      return { ...f, inhabitants: next };
    });
  };

  const addMember = () => setForm((f) => ({ ...f, inhabitants: [...(f.inhabitants || []), emptyInhabitant()] }));
  const removeMember = (index) => {
    setForm((f) => {
      const next = f.inhabitants.filter((_, i) => i !== index);
      return { ...f, inhabitants: next.length ? next : [emptyInhabitant()] };
    });
  };

  const canSetHouseholdNumber = ['secretary', 'punong_barangay'].includes(user?.role);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      region: form.region,
      province: form.province,
      cityMunicipality: form.cityMunicipality,
      barangay: form.barangay,
      householdAddress: form.householdAddress,
      householdNumber: canSetHouseholdNumber ? form.householdNumber : undefined,
      inhabitants: form.inhabitants.map((inv) => ({
        ...inv,
        dateOfBirth: inv.dateOfBirth || undefined,
        age: inv.age === '' ? undefined : Number(inv.age),
      })),
      dataSource: form.dataSource,
    };
    try {
      if (isEdit) {
        await client.put(`/households/${id}`, payload);
        navigate(`/households/${id}`);
      } else {
        await client.post('/households', payload);
        navigate('/households');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <p>Loading...</p>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>{isEdit ? 'Edit household' : 'New household (Form A)'}</h1>
        <Link to={isEdit ? `/households/${id}` : '/households'} className="btn btn-outline">Cancel</Link>
      </div>
      <form onSubmit={handleSubmit} className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0 }}>Household information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label>Region</label>
            <input value={form.region} onChange={(e) => update('region', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Province</label>
            <input value={form.province} onChange={(e) => update('province', e.target.value)} />
          </div>
          <div className="form-group">
            <label>City / Municipality</label>
            <input value={form.cityMunicipality} onChange={(e) => update('cityMunicipality', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Barangay</label>
            <input value={form.barangay} onChange={(e) => update('barangay', e.target.value)} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Household address</label>
            <input value={form.householdAddress} onChange={(e) => update('householdAddress', e.target.value)} />
          </div>
          {canSetHouseholdNumber && (
            <div className="form-group">
              <label>Household number</label>
              <input value={form.householdNumber} onChange={(e) => update('householdNumber', e.target.value)} placeholder="Assigned by Secretary" />
            </div>
          )}
          {isStaff && (
            <div className="form-group">
              <label>Data source</label>
              <select value={form.dataSource} onChange={(e) => update('dataSource', e.target.value)}>
                <option value="staff-assisted">Staff-assisted</option>
                <option value="encoded-from-paper">Encoded from paper</option>
              </select>
            </div>
          )}
        </div>

        <h2 style={{ marginTop: '1.5rem' }}>Household members</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No. of members: {form.inhabitants?.length ?? 0}</p>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Last name</th>
                <th>First name</th>
                <th>Middle name</th>
                <th>Ext.</th>
                <th>Place of birth</th>
                <th>Date of birth</th>
                <th>Age</th>
                <th>Sex</th>
                <th>Civil status</th>
                <th>Citizenship</th>
                <th>Occupation</th>
                <th>Labor / Unemployed / PWD / OFW / Solo / OSY / OSC / IP</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(form.inhabitants || []).map((inv, i) => (
                <tr key={i}>
                  <td><input value={inv.lastName} onChange={(e) => updateInhabitant(i, 'lastName', e.target.value)} style={{ width: '100%', minWidth: 80 }} /></td>
                  <td><input value={inv.firstName} onChange={(e) => updateInhabitant(i, 'firstName', e.target.value)} style={{ width: '100%', minWidth: 80 }} /></td>
                  <td><input value={inv.middleName} onChange={(e) => updateInhabitant(i, 'middleName', e.target.value)} style={{ width: '100%', minWidth: 70 }} /></td>
                  <td><input value={inv.nameExtension} onChange={(e) => updateInhabitant(i, 'nameExtension', e.target.value)} placeholder="Jr." style={{ width: 50 }} /></td>
                  <td><input value={inv.placeOfBirth} onChange={(e) => updateInhabitant(i, 'placeOfBirth', e.target.value)} style={{ width: '100%', minWidth: 90 }} /></td>
                  <td><input type="date" value={inv.dateOfBirth} onChange={(e) => updateInhabitant(i, 'dateOfBirth', e.target.value)} /></td>
                  <td><input type="number" min={0} value={inv.age} onChange={(e) => updateInhabitant(i, 'age', e.target.value)} style={{ width: 50 }} /></td>
                  <td>
                    <select value={inv.sex} onChange={(e) => updateInhabitant(i, 'sex', e.target.value)} style={{ minWidth: 80 }}>
                      <option value="">—</option>
                      {SEX_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <select value={inv.civilStatus} onChange={(e) => updateInhabitant(i, 'civilStatus', e.target.value)} style={{ minWidth: 100 }}>
                      <option value="">—</option>
                      {CIVIL_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </td>
                  <td><input value={inv.citizenship} onChange={(e) => updateInhabitant(i, 'citizenship', e.target.value)} style={{ width: 90 }} /></td>
                  <td><input value={inv.occupation} onChange={(e) => updateInhabitant(i, 'occupation', e.target.value)} style={{ width: 100 }} /></td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <label><input type="checkbox" checked={!!inv.isLaborEmployed} onChange={(e) => updateInhabitant(i, 'isLaborEmployed', e.target.checked)} /> L</label>
                    <label><input type="checkbox" checked={!!inv.isUnemployed} onChange={(e) => updateInhabitant(i, 'isUnemployed', e.target.checked)} /> U</label>
                    <label><input type="checkbox" checked={!!inv.isPWD} onChange={(e) => updateInhabitant(i, 'isPWD', e.target.checked)} /> PWD</label>
                    <label><input type="checkbox" checked={!!inv.isOFW} onChange={(e) => updateInhabitant(i, 'isOFW', e.target.checked)} /> OFW</label>
                    <label><input type="checkbox" checked={!!inv.isSoloParent} onChange={(e) => updateInhabitant(i, 'isSoloParent', e.target.checked)} /> SP</label>
                    <label><input type="checkbox" checked={!!inv.isOSY} onChange={(e) => updateInhabitant(i, 'isOSY', e.target.checked)} /> OSY</label>
                    <label><input type="checkbox" checked={!!inv.isOSC} onChange={(e) => updateInhabitant(i, 'isOSC', e.target.checked)} /> OSC</label>
                    <label><input type="checkbox" checked={!!inv.isIP} onChange={(e) => updateInhabitant(i, 'isIP', e.target.checked)} /> IP</label>
                  </td>
                  <td>
                    <button type="button" className="btn btn-outline btn-danger" style={{ padding: '0.25rem 0.5rem' }} onClick={() => removeMember(i)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" className="btn btn-outline" onClick={addMember} style={{ marginTop: '0.5rem' }}>Add member</button>

        <div style={{ marginTop: '1.5rem' }}>
          <button type="submit" className="btn" disabled={loading}>{loading ? 'Saving...' : 'Save household'}</button>
        </div>
      </form>
    </>
  );
}
