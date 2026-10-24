"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";

import { cleanCityInput, findCatalogCity, searchCities } from "@/content/cities-search";
import { sr } from "@/content/sr";
import { cn } from "@/lib/utils";

interface CityComboboxProps {
  id?: string;
  countryCode: string;
  value: string;
  onChange: (city: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}

interface Option {
  key: string;
  label: string;
  value: string;
}

const inputClass =
  "border-input bg-background flex h-12 w-full rounded-md border px-3 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/40 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50";

/**
 * Pretraživo polje za grad (WAI-ARIA combobox sa listboxom). Vrijednost u formi se mijenja
 * tek kad se izabere grad sa spiska (svoj grad se ne može dodati), a ukucani tekst bez izbora se pri
 * napuštanju polja vraća na posljednju izabranu vrijednost.
 */
export function CityCombobox({ id, countryCode, value, onChange, disabled, invalid, describedBy }: CityComboboxProps) {
  const t = sr.profile.cityPicker;
  const reactId = useId();
  const listId = `${reactId}-list`;
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lastValue, setLastValue] = useState(value);

  // Vrijednost promijenjena spolja (reset pri promjeni države, učitani nacrt): osvježi tekst.
  if (value !== lastValue) {
    setLastValue(value);
    setText(value);
  }

  const query = cleanCityInput(text);
  const showingAll = query === "" || query === value;

  const options = useMemo(
    () =>
      searchCities(countryCode, showingAll ? "" : query).map<Option>((name) => ({
        key: `c-${name}`,
        label: name,
        value: name,
      })),
    [countryCode, query, showingAll],
  );

  const clampedActive = Math.min(activeIndex, Math.max(options.length - 1, 0));

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [open, clampedActive]);

  function select(option: Option) {
    onChange(option.value);
    setText(option.value);
    setLastValue(option.value);
    setOpen(false);
  }

  function revert() {
    setText(value);
    setOpen(false);
  }

  function handleBlur() {
    // Točan pogodak (npr. "sabac" -> "Šabac") prihvati i bez klika.
    const exact = query ? findCatalogCity(query, countryCode) : null;
    if (exact && exact !== value) {
      onChange(exact);
      setText(exact);
      setLastValue(exact);
      setOpen(false);
      return;
    }
    revert();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) setOpen(true);
        else setActiveIndex((clampedActive + 1) % Math.max(options.length, 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) setOpen(true);
        else setActiveIndex((clampedActive - 1 + options.length) % Math.max(options.length, 1));
        break;
      case "Enter":
        if (open && options[clampedActive]) {
          e.preventDefault();
          select(options[clampedActive]);
        } else if (open) {
          e.preventDefault();
        }
        break;
      case "Escape":
        if (open) {
          e.preventDefault();
          revert();
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  const activeId = open && options[clampedActive] ? `${listId}-${clampedActive}` : undefined;

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        autoCapitalize="words"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="done"
        disabled={disabled || !countryCode}
        placeholder={countryCode ? t.placeholder : t.selectCountryFirst}
        value={text}
        maxLength={60}
        className={cn(inputClass, invalid && "border-destructive")}
        onChange={(e) => {
          setText(e.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={sr.profile.steps.basic.city}
          className="bg-popover text-popover-foreground absolute z-30 mt-1 max-h-64 w-full overflow-y-auto overscroll-contain rounded-md border py-1 shadow-md"
        >
          {options.map((option, index) => (
            <li
              key={option.key}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === clampedActive}
              // mouseDown (ne click) + preventDefault: input ne gubi fokus prije izbora (radi i na dodir).
              onMouseDown={(e) => {
                e.preventDefault();
                select(option);
              }}
              onMouseMove={() => setActiveIndex(index)}
              className={cn(
                "cursor-pointer px-3.5 py-3 text-base sm:py-2",
                index === clampedActive && "bg-secondary",
              )}
            >
              {option.label}
            </li>
          ))}
          {options.length === 0 && (
            <li role="presentation" className="text-muted-foreground px-3.5 py-2 text-sm">
              {t.noResults}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
