import React, { useState, useEffect } from 'react';
import { Store, MapPin, Clock, Save, Image as ImageIcon, Sparkles, UtensilsCrossed } from 'lucide-react';
import api from '../../services/api';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form Fields
  const [shopName, setShopName] = useState('');
  const [description, setDescription] = useState('');
  const [cuisines, setCuisines] = useState('');
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('22:00');

  // Address
  const [houseNo, setHouseNo] = useState('');
  const [streetName, setStreetName] = useState('');
  const [society, setSociety] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);

  // Logo & Banner files
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  
  // Previews
  const [logoPreview, setLogoPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');

  useEffect(() => {
    const fetchShopProfile = async () => {
      try {
        const { data } = await api.get('/shop/profile');
        if (data.success && data.data) {
          const shop = data.data;
          setShopName(shop.shopName || '');
          setDescription(shop.description || '');
          setCuisines(shop.cuisines ? shop.cuisines.join(', ') : '');
          setOpeningTime(shop.openingTime || '09:00');
          setClosingTime(shop.closingTime || '22:00');

          if (shop.address) {
            setHouseNo(shop.address.houseNo || '');
            setStreetName(shop.address.streetName || '');
            setSociety(shop.address.society || '');
            setAddressLine(shop.address.addressLine || '');
            setCity(shop.address.city || '');
            setState(shop.address.state || '');
            setZipCode(shop.address.zipCode || '');
            setLatitude(shop.address.latitude || 0);
            setLongitude(shop.address.longitude || 0);
          }

          setLogoPreview(shop.logo || '');
          setBannerPreview(shop.banner || '');
        }
      } catch (err) {
        console.error('Failed to load shop settings profile:', err);
        setErrorMsg('Could not load restaurant profile data.');
      } finally {
        setLoading(false);
      }
    };
    fetchShopProfile();
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('shopName', shopName);
      formData.append('description', description);
      formData.append('cuisines', cuisines);
      formData.append('openingTime', openingTime);
      formData.append('closingTime', closingTime);

      const combinedAddressLine = `${houseNo ? houseNo + ', ' : ''}${society ? society + ', ' : ''}${streetName}`;
      const addressObj = {
        houseNo,
        streetName,
        society,
        addressLine: combinedAddressLine || addressLine,
        city,
        state,
        zipCode,
        latitude: Number(latitude),
        longitude: Number(longitude)
      };
      formData.append('address', JSON.stringify(addressObj));

      if (logoFile) {
        formData.append('logo', logoFile);
      }
      if (bannerFile) {
        formData.append('banner', bannerFile);
      }

      const { data } = await api.put('/shop/profile', formData);
      if (data.success) {
        setSuccessMsg('Restaurant settings updated successfully!');
        if (data.data) {
          setLogoPreview(data.data.logo || logoPreview);
          setBannerPreview(data.data.banner || bannerPreview);
        }
        // Smooth scroll to top to see success banner
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to update shop owner settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-slate-900 rounded-xl shimmer-dark" />
        <div className="h-96 bg-slate-900 border border-slate-800 rounded-3xl shimmer-dark" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-inter text-slate-100 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="font-poppins font-black text-2xl sm:text-3xl text-white">Restaurant Settings</h1>
        <p className="text-xs text-slate-400 font-semibold mt-1">Configure restaurant display details, locations, hours, and branding.</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-900/50 rounded-2xl text-xs text-emerald-400 font-bold">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-950/40 border border-rose-900/50 rounded-2xl text-xs text-rose-400 font-bold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* SECTION 1: COVER BRANDING IMAGES */}
        <div className="bg-slate-900 border border-slate-850 p-6 sm:p-8 rounded-3xl shadow-premium space-y-6">
          <h3 className="font-poppins font-bold text-sm text-white flex items-center gap-2 border-b border-slate-850 pb-3">
            <ImageIcon size={16} className="text-brand-500" /> Branding & Covers
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            
            {/* Banner Cover (2 cols) */}
            <div className="md:col-span-2 space-y-4">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">BANNER BRANDING</label>
              <div className="relative h-44 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                {bannerPreview ? (
                  <img src={bannerPreview} alt="Banner Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-slate-500 font-semibold">No Banner Uploaded</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerChange}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
              />
            </div>

            {/* Logo (1 col) */}
            <div className="md:col-span-1 space-y-4">
              <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">LOGO DESIGN</label>
              <div className="relative w-36 h-36 mx-auto bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-slate-500 font-semibold">No Logo</span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="w-full text-[10px] text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-bold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
              />
            </div>

          </div>
        </div>

        {/* SECTION 2: BASIC DETAILS */}
        <div className="bg-slate-900 border border-slate-850 p-6 sm:p-8 rounded-3xl shadow-premium space-y-6">
          <h3 className="font-poppins font-bold text-sm text-white flex items-center gap-2 border-b border-slate-850 pb-3">
            <Store size={16} className="text-brand-500" /> Restaurant Profile details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">RESTAURANT NAME *</label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">DESCRIPTION *</label>
              <textarea
                required
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">CUISINES TAGS (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. North Indian, Italian, Desserts"
                value={cuisines}
                onChange={(e) => setCuisines(e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-brand-500"
              />
            </div>

            {/* Operating Hours */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">OPENING TIME</label>
                <input
                  type="text"
                  placeholder="09:00"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">CLOSING TIME</label>
                <input
                  type="text"
                  placeholder="22:00"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: PHYSICAL ADDRESS */}
        <div className="bg-slate-900 border border-slate-850 p-6 sm:p-8 rounded-3xl shadow-premium space-y-6">
          <h3 className="font-poppins font-bold text-sm text-white flex items-center gap-2 border-b border-slate-850 pb-3">
            <MapPin size={16} className="text-brand-500" /> Physical Address Coordinates
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">HOUSE / SHOP / OFFICE NO *</label>
              <input
                type="text"
                required
                placeholder="e.g. Shop 12, Ground Floor"
                value={houseNo}
                onChange={(e) => setHouseNo(e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">SOCIETY / BUILDING / LANDMARK</label>
              <input
                type="text"
                placeholder="e.g. Royal Arcade, Near Metro"
                value={society}
                onChange={(e) => setSociety(e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">STREET / LOCALITY NAME *</label>
              <input
                type="text"
                required
                placeholder="e.g. MG Road, Sector 4"
                value={streetName}
                onChange={(e) => setStreetName(e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">CITY / DISTRICT *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">STATE *</label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">ZIP CODE *</label>
                <input
                  type="text"
                  required
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:col-span-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">GPS LATITUDE *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 tracking-wider">GPS LONGITUDE *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-semibold px-4 py-3 bg-slate-950 border border-slate-800 text-white rounded-xl focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-4 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-glow flex items-center justify-center gap-2 transition"
        >
          <Save size={16} />
          {saving ? 'Saving Adjustments...' : 'Save Settings Details'}
        </button>

      </form>
    </div>
  );
};

export default Settings;
