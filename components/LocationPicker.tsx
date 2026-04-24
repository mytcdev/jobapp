"use client";

import { useState } from "react";
import { Country, State } from "country-state-city";

const ALL_COUNTRIES = Country.getAllCountries();

interface Props {
  initialCountry?: string;
  initialState?: string;
  initialCity?: string;
  initialPostalCode?: string;
  required?: boolean;
}

export default function LocationPicker({
  initialCountry = "",
  initialState = "",
  initialCity = "",
  initialPostalCode = "",
  required = true,
}: Props) {
  const findIso = (name: string) =>
    ALL_COUNTRIES.find((c) => c.name === name)?.isoCode ?? "";

  const [countryName, setCountryName] = useState(initialCountry);
  const [countryIso, setCountryIso] = useState(() => findIso(initialCountry));
  const [stateName, setStateName]   = useState(initialState);

  const states = countryIso ? State.getStatesOfCountry(countryIso) : [];

  function handleCountryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setCountryName(val);
    const match = ALL_COUNTRIES.find((c) => c.name === val);
    setCountryIso(match?.isoCode ?? "");
    setStateName("");
  }

  const inputCls = "border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black";

  return (
    <div className="flex flex-col gap-4">
      {/* Country */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="country">Country</label>
        <input
          id="country"
          name="country"
          type="text"
          list="lp-country-list"
          value={countryName}
          onChange={handleCountryChange}
          placeholder="Type to search a country…"
          className={inputCls}
          required={required}
          autoComplete="off"
        />
        <datalist id="lp-country-list">
          {ALL_COUNTRIES.map((c) => (
            <option key={c.isoCode} value={c.name} />
          ))}
        </datalist>
      </div>

      {/* State / Province */}
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium" htmlFor="state">State / Province</label>
        {states.length > 0 ? (
          <select
            id="state"
            name="state"
            value={stateName}
            onChange={(e) => setStateName(e.target.value)}
            className={inputCls}
            required={required}
          >
            <option value="">— Select a state —</option>
            {states.map((s) => (
              <option key={s.isoCode} value={s.name}>{s.name}</option>
            ))}
          </select>
        ) : (
          <input
            id="state"
            name="state"
            type="text"
            value={stateName}
            onChange={(e) => setStateName(e.target.value)}
            placeholder={countryName ? "State / Province (optional)" : "Select a country first"}
            className={inputCls}
          />
        )}
      </div>

      {/* City + Postal code */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="city">City</label>
          <input
            id="city"
            name="city"
            type="text"
            defaultValue={initialCity}
            placeholder="e.g. Kuala Lumpur"
            className={inputCls}
            required={required}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" htmlFor="postal_code">Postal / ZIP Code</label>
          <input
            id="postal_code"
            name="postal_code"
            type="text"
            defaultValue={initialPostalCode}
            placeholder="e.g. 50480"
            className={inputCls}
          />
        </div>
      </div>
    </div>
  );
}
