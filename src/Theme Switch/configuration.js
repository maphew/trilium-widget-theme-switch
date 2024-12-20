let configuration = {
    
    'button': 'switch',   // One of: 'button' | 'switch'

    'icon': {
        'button': { dark: 'bx-moon', light: 'bx-sun' },
        'item': { active: 'bxs-paint-roll', inactive: 'bx-paint-roll' },
    },

    'frontendReload': false,

    'showDropdown': true,

    'darkVariantTimeRange': { start: '21:00', end: '06:00' },

    'variantMap': {
        'catppuccin-frappe':    { variant: 'dark',  light: 'catppuccin-mocha',     },
        'catppuccin-latte':     { variant: 'light', dark:  'catppuccin-macchiato', },
        'catppuccin-macchiato': { variant: 'dark',  light: 'catppuccin-latte',     },
        'catppuccin-mocha':     { variant: 'dark',  light: 'catppuccin-frappe',    },
        'linen':                { variant: 'light', dark:  undefined,   },
        'obsidian':             { variant: 'dark',  light: undefined,   },
        'steel-blue':           { variant: 'dark',  light: undefined,   },
    }
    
}

module.exports = configuration



/*

-----------------------------------------------------------------------------------------------------------------------
HELP

button                       [string] Style of the button
                             - 'button': static button in accordance with Trilium title bar buttons design
                             - 'switch': animated switch that follows current theme style

icon                         [object] Icons used for the toggle switch and the dropdown items.
                             Examples:
                                'button': { dark: 'bx-moon', light: 'bx-sun' },
                                //'item': { active: 'bxs-spray-can', inactive: 'bx-spray-can' },
                                //'item': { active: 'bxs-bulb', inactive: 'bx-bulb' },
                                'theme': { active: 'bxs-paint-roll', inactive: 'bx-paint-roll' },

frontendReload               [boolean] Whether the frontend should be reloaded when changing themes. 
                             When set to false, instead of reloading the frontend, the widget activates the new theme 
                             by updating stylesheets in the DOM (Document Object Model). This results in more fluid UX, 
                             but might not be the preferred way.

showDropdown                 [boolean] Whether dropdown with available themes will be shown

darkVariantTimeRange         [object] Time range in which dark mode/variant should automatically be activated. Comment 
                             the line to disable. If enabled, the theme will also be set on app start. Supports both 
                             12-hour and 24-hour formats with optional minutes, seconds and even miliseconds.
                             Format: 'h:m:s.ms [AM|PM]' case insensitive, whitespace irrelevant
                             Examples: '7', '19', '7PM', '07 PM', '19:45:24', '2:00:00 am', '20:00:00.000'
                             { start: '21:00', end: '07:00' },

variantMap                   [object] Used to define variants for themes that don't have dark/light suffix set in the 
                             theme ID
                             - variant        default mode for the theme
                             - light | dark   alternative variant
                             Examples:
                                'catppuccin-frappe':    { variant: 'dark',  light: 'catppuccin-mocha',     },
                                'catppuccin-latte':     { variant: 'light', dark:  'catppuccin-macchiato', },
                                'catppuccin-macchiato': { variant: 'dark',  light: 'catppuccin-latte',     },
                                'catppuccin-mocha':     { variant: 'dark',  light: 'catppuccin-frappe',    },
                                'linen':                { variant: 'light', dark:  undefined,   },
                                'obsidian':             { variant: 'dark',  light: undefined,   },
                                'steel-blue':           { variant: 'dark',  light: undefined,   },

-----------------------------------------------------------------------------------------------------------------------

*/