export interface FilterOption {
    id: string
    label: string
}

export interface ColorOption extends FilterOption {
    hex: string
}

interface BaseFilter {
    id: string
    label: string
    icon?: string
    description?: string
}


export interface ToggleFilter extends BaseFilter { type: 'toggle' }
export interface CheckboxFilter extends BaseFilter { type: 'checkbox'; options: FilterOption[] }
export interface RadioFilter extends BaseFilter { type: 'radio'; options: FilterOption[] }
export interface ColorFilter extends BaseFilter { type: 'color'; options: ColorOption[] }
export interface RangeFilter extends BaseFilter { type: 'range'; min: number; max: number; step?: number }

export type FilterDefinition =
    ToggleFilter |
    CheckboxFilter |
    RadioFilter | 
    ColorFilter | 
    RangeFilter

export interface FiltersResponse {
  items: FilterDefinition[]
}

// Active selections keyed by filter id — shape depends on the filter's own type
export type FilterValue = 
boolean | 
string | 
string[] | 
[number, number] | 
null