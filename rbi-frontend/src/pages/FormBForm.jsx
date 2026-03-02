import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const SEX_OPTIONS = ['Male', 'Female', 'Other'];
const CIVIL_OPTIONS = ['Single', 'Married', 'Widowed', 'Separated', 'Annulled', 'Common Law', 'Unknown'];
const EDUC_OPTIONS = ['Elementary', 'High School', 'College', 'Post Grad', 'Vocational'];
const GRAD_OPTIONS = ['', 'Graduate', 'Under Graduate'];

const emptyForm = () => ({
  region: '',
  province: '',
  cityMunicipality: '',
  barangay: '',
  householdNumber: '',
  residenceAddress: '',
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
  religion: '',
  contactNumber: '',
  email: '',
  occupation: '',
  philSysCardNo: '',
  highestEducationalAttainment: '',
  graduateOrUndergraduate: '',
  courseSpecification: '',
  isLaborEmployed: false,
  isUnemployed: false,
  isPWD: false,
  isOFW: false,
  isSoloParent: false,
  isOSY: false,
  isOSC: false,
  isIP: false,
  dataSource: 'self-entered',
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

export default function FormBForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);
  const isStaff = ['encoder', 'secretary', 'punong_barangay'].includes(user?.role);

  const [form, setForm] = useState(() => ({ ...emptyForm(), dataSource: user?.role === 'resident' ? 'self-entered' : 'staff-assisted' }));
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) {
      if (user?.barangay) setForm((f) => ({ ...f, barangay: user.barangay, cityMunicipality: user.cityMunicipality, province: user.province, region: user.region }));
      return;
    }
    client.get(`/form-b/${id}`)
      .then((res) => {
        const r = res.data;
        setForm({
          region: r.region || '',
          province: r.province || '',
          cityMunicipality: r.cityMunicipality || '',
          barangay: r.barangay || '',
          householdNumber: r.householdNumber || '',
          residenceAddress: r.residenceAddress || '',
          lastName: r.lastName || '',
          firstName: r.firstName || '',
          middleName: r.middleName || '',
          nameExtension: r.nameExtension || '',
          placeOfBirth: r.placeOfBirth || '',
          dateOfBirth: r.dateOfBirth ? (r.dateOfBirth.slice ? r.dateOfBirth.slice(0, 10) : new Date(r.dateOfBirth).toISOString().slice(0, 10)) : '',
          age: r.age ?? '',
          sex: r.sex || '',
          civilStatus: r.civilStatus || '',
          citizenship: r.citizenship || '',
          religion: r.religion || '',
          contactNumber: r.contactNumber || '',
          email: r.email || '',
          occupation: r.occupation || '',
          philSysCardNo: r.philSysCardNo || '',
          highestEducationalAttainment: r.highestEducationalAttainment || '',
          graduateOrUndergraduate: r.graduateOrUndergraduate || '',
          courseSpecification: r.courseSpecification || '',
          isLaborEmployed: !!r.isLaborEmployed,
          isUnemployed: !!r.isUnemployed,
          isPWD: !!r.isPWD,
          isOFW: !!r.isOFW,
          isSoloParent: !!r.isSoloParent,
          isOSY: !!r.isOSY,
          isOSC: !!r.isOSC,
          isIP: !!r.isIP,
          dataSource: r.dataSource || (user?.role === 'resident' ? 'self-entered' : 'staff-assisted'),
        });
      })
      .catch(() => {})
      .finally(() => setFetchLoading(false));
  }, [id, isEdit]);

  const update = (field, value) => {
    setForm((f) => {
      const next = { ...f, [field]: value };
      if (field === 'dateOfBirth') next.age = calcAge(value);
      return next;
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
      householdNumber: canSetHouseholdNumber ? form.householdNumber : undefined,
      residenceAddress: form.residenceAddress,
      lastName: form.lastName,
      firstName: form.firstName,
      middleName: form.middleName,
      nameExtension: form.nameExtension,
      placeOfBirth: form.placeOfBirth,
      dateOfBirth: form.dateOfBirth || undefined,
      age: form.age === '' ? undefined : Number(form.age),
      sex: form.sex || undefined,
      civilStatus: form.civilStatus || undefined,
      citizenship: form.citizenship,
      religion: form.religion,
      contactNumber: form.contactNumber,
      email: form.email,
      occupation: form.occupation,
      philSysCardNo: form.philSysCardNo,
      highestEducationalAttainment: form.highestEducationalAttainment || undefined,
      graduateOrUndergraduate: form.graduateOrUndergraduate || undefined,
      courseSpecification: form.courseSpecification,
      isLaborEmployed: form.isLaborEmployed,
      isUnemployed: form.isUnemployed,
      isPWD: form.isPWD,
      isOFW: form.isOFW,
      isSoloParent: form.isSoloParent,
      isOSY: form.isOSY,
      isOSC: form.isOSC,
      isIP: form.isIP,
      dataSource: form.dataSource,
    };
    try {
      if (isEdit) {
        await client.put(`/form-b/${id}`, payload);
        navigate(`/form-b/${id}`);
      } else {
        await client.post('/form-b', payload);
        navigate('/form-b');
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
        <h1 style={{ margin: 0 }}>{isEdit ? 'Edit Form B' : 'New Form B (Individual record)'}</h1>
        <Link to={isEdit ? `/form-b/${id}` : '/form-b'} className="btn btn-outline">Cancel</Link>
      </div>
      <form onSubmit={handleSubmit} className="card" style={{ marginTop: '1rem' }}>
        <h2 style={{ marginTop: 0 }}>Location</h2>
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
            <label>Residence address</label>
            <input value={form.residenceAddress} onChange={(e) => update('residenceAddress', e.target.value)} />
          </div>
          {canSetHouseholdNumber && (
            <div className="form-group">
              <label>Household number</label>
              <input value={form.householdNumber} onChange={(e) => update('householdNumber', e.target.value)} placeholder="Assigned by Secretary" />
            </div>
          )}
        </div>

        <h2 style={{ marginTop: '1.5rem' }}>Personal information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label>PhiSys Card No.</label>
            <input value={form.philSysCardNo} onChange={(e) => update('philSysCardNo', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Last name</label>
            <input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} />
          </div>
          <div className="form-group">
            <label>First name</label>
            <input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Middle name</label>
            <input value={form.middleName} onChange={(e) => update('middleName', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Name extension</label>
            <input value={form.nameExtension} onChange={(e) => update('nameExtension', e.target.value)} placeholder="Jr., III" />
          </div>
          <div className="form-group">
            <label>Date of birth</label>
            <input type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Place of birth</label>
            <input value={form.placeOfBirth} onChange={(e) => update('placeOfBirth', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Age</label>
            <input type="number" min={0} value={form.age} onChange={(e) => update('age', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Sex</label>
            <select value={form.sex} onChange={(e) => update('sex', e.target.value)}>
              <option value="">—</option>
              {SEX_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Civil status</label>
            <select value={form.civilStatus} onChange={(e) => update('civilStatus', e.target.value)}>
              <option value="">—</option>
              {CIVIL_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Religion</label>
            <input value={form.religion} onChange={(e) => update('religion', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Citizenship</label>
            <input value={form.citizenship} onChange={(e) => update('citizenship', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Occupation</label>
            <input value={form.occupation} onChange={(e) => update('occupation', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Contact number</label>
            <input value={form.contactNumber} onChange={(e) => update('contactNumber', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
          </div>
        </div>

        <h2 style={{ marginTop: '1.5rem' }}>Highest educational attainment</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          <div className="form-group">
            <label>Level</label>
            <select value={form.highestEducationalAttainment} onChange={(e) => update('highestEducationalAttainment', e.target.value)}>
              <option value="">—</option>
              {EDUC_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Graduate / Under graduate</label>
            <select value={form.graduateOrUndergraduate} onChange={(e) => update('graduateOrUndergraduate', e.target.value)}>
              {GRAD_OPTIONS.map((g) => <option key={g || 'blank'} value={g}>{g || '—'}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Course specification</label>
            <input value={form.courseSpecification} onChange={(e) => update('courseSpecification', e.target.value)} />
          </div>
        </div>

        <h2 style={{ marginTop: '1.5rem' }}>Status (check all that apply)</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
          <label><input type="checkbox" checked={form.isLaborEmployed} onChange={(e) => update('isLaborEmployed', e.target.checked)} /> Labor employed</label>
          <label><input type="checkbox" checked={form.isUnemployed} onChange={(e) => update('isUnemployed', e.target.checked)} /> Unemployed</label>
          <label><input type="checkbox" checked={form.isPWD} onChange={(e) => update('isPWD', e.target.checked)} /> PWD</label>
          <label><input type="checkbox" checked={form.isOFW} onChange={(e) => update('isOFW', e.target.checked)} /> OFW</label>
          <label><input type="checkbox" checked={form.isSoloParent} onChange={(e) => update('isSoloParent', e.target.checked)} /> Solo parent</label>
          <label><input type="checkbox" checked={form.isOSY} onChange={(e) => update('isOSY', e.target.checked)} /> OSY</label>
          <label><input type="checkbox" checked={form.isOSC} onChange={(e) => update('isOSC', e.target.checked)} /> OSC</label>
          <label><input type="checkbox" checked={form.isIP} onChange={(e) => update('isIP', e.target.checked)} /> IP</label>
        </div>

        {isStaff && (
          <>
            <h2 style={{ marginTop: '1.5rem' }}>Data source</h2>
            <div className="form-group" style={{ maxWidth: 200 }}>
              <select value={form.dataSource} onChange={(e) => update('dataSource', e.target.value)}>
                <option value="staff-assisted">Staff-assisted</option>
                <option value="encoded-from-paper">Encoded from paper</option>
              </select>
            </div>
          </>
        )}

        <div style={{ marginTop: '1.5rem' }}>
          <button type="submit" className="btn" disabled={loading}>{loading ? 'Saving...' : 'Save Form B'}</button>
        </div>
      </form>
    </>
  );
}
