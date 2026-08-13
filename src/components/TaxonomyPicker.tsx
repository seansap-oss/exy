import type { AttrDef } from '../data/taxonomy';
import { TAXONOMY, attributesOf, subcategoriesOf, typesOf } from '../data/taxonomy';

export interface TaxonomySelection {
  categoryId: string;
  subCategoryId: string;
  typeId: string;
  attributes: Record<string, string>;
}

interface Props {
  value: TaxonomySelection;
  onChange: (next: TaxonomySelection) => void;
  /** `compact` renders inline selects for the bulk-import row drawer. */
  variant?: 'full' | 'compact';
  /** Hides the dynamic attribute block (bulk grid uses the Details drawer). */
  hideAttributes?: boolean;
  /** Prefixes field ids so multiple pickers can coexist without duplicate ids. */
  idPrefix?: string;
}

/**
 * Shared category → subcategory → type picker plus dynamic, category-specific
 * attribute fields. Used by the mobile sell flow, Express Post Drawer, admin
 * single form and bulk importer so all four stay on one taxonomy and one set
 * of validation rules.
 */
export function TaxonomyPicker({ value, onChange, variant = 'full', hideAttributes = false, idPrefix = 'tx' }: Props) {
  const subs = value.categoryId ? subcategoriesOf(value.categoryId) : [];
  const types = value.categoryId && value.subCategoryId ? typesOf(value.categoryId, value.subCategoryId) : [];
  const attrs = value.categoryId ? attributesOf(value.categoryId) : [];

  const setCategory = (categoryId: string) =>
    // Changing a parent clears its children so an orphaned id is never stored.
    onChange({ categoryId, subCategoryId: '', typeId: '', attributes: {} });

  const setSub = (subCategoryId: string) => onChange({ ...value, subCategoryId, typeId: '' });
  const setType = (typeId: string) => onChange({ ...value, typeId });
  const setAttr = (key: string, next: string) =>
    onChange({ ...value, attributes: { ...value.attributes, [key]: next } });

  const gridClass = variant === 'compact' ? 'form-grid form-grid--3' : 'form-grid';

  return (
    <>
      <div className={gridClass}>
        <div className="field">
          <label className="field__label" htmlFor={`${idPrefix}-cat`}>
            Main category
          </label>
          <select id={`${idPrefix}-cat`} className="select" value={value.categoryId} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Select category…</option>
            {TAXONOMY.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {subs.length > 0 && (
          <div className="field">
            <label className="field__label" htmlFor={`${idPrefix}-sub`}>
              Subcategory
            </label>
            <select id={`${idPrefix}-sub`} className="select" value={value.subCategoryId} onChange={(e) => setSub(e.target.value)}>
              <option value="">Select subcategory…</option>
              {subs.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {types.length > 0 && (
          <div className="field">
            <label className="field__label" htmlFor={`${idPrefix}-type`}>
              Type
            </label>
            <select id={`${idPrefix}-type`} className="select" value={value.typeId} onChange={(e) => setType(e.target.value)}>
              <option value="">Select type…</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Dynamic, category-specific fields */}
      {!hideAttributes && attrs.length > 0 && (
        <>
          <span className="field__label" style={{ display: 'block', marginBottom: 8 }}>
            {TAXONOMY.find((c) => c.id === value.categoryId)?.name} details
          </span>
          <div className="form-grid form-grid--3">
            {attrs.map((attr) => (
              <AttrField
                key={attr.key}
                attr={attr}
                value={value.attributes[attr.key] ?? ''}
                onChange={(next) => setAttr(attr.key, next)}
                idPrefix={idPrefix}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}

function AttrField({
  attr,
  value,
  onChange,
  idPrefix,
}: {
  attr: AttrDef;
  value: string;
  onChange: (next: string) => void;
  idPrefix: string;
}) {
  const id = `${idPrefix}-attr-${attr.key}`;
  const label = `${attr.label}${attr.unit ? ` (${attr.unit})` : ''}${attr.required ? ' *' : ''}`;

  if (attr.input === 'select' && attr.options?.length) {
    return (
      <div className="field">
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
        <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Any</option>
          {attr.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (attr.input === 'boolean') {
    return (
      <div className="field">
        <label className="field__label" htmlFor={id}>
          {label}
        </label>
        <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">Not specified</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
        </select>
      </div>
    );
  }

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="input"
        type={attr.input === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
