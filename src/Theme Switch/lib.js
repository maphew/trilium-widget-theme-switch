let _ = {


    // Trilium Backend Script API

        // Retrieve basic information about running Trilium version 
        'getAppInfo': async () => {
            return await api.runAsyncOnBackendWithManualTransactionHandling(async () => {
                return api.getAppInfo()
            })
        },

        // Retrieves Trilium option via private API
        'getOption': async (key) => {
            return await api.runAsyncOnBackendWithManualTransactionHandling(async (params) => {
                return api.__private.becca.getOption(params.key)?.value
            }, [{key: key}])
        },

        // Sets Trilium option via private API
        'setOption': async (key, value) => {
            await api.runAsyncOnBackendWithManualTransactionHandling(async (params) => {
                const option = api.__private.becca.getOption(params.key)
                option.value = params.value
                option.save()
            }, [{key: key, value: value}])
            await api.waitUntilSynced()
        },

    'isHtmlNote': (note) => {
        return note?.type === 'code' && note?.mime === 'text/html'
    },

    'isCssNote': (note) => {
        return note?.type === 'code' && note?.mime === 'text/css'
    },

    'isJavaScriptNote': (note) => {
        return (note?.type === "code" || note?.type === "file" || note?.type === 'launcher')
            && (note?.mime.startsWith("application/javascript"))
    },

    // Returns true if native title bar is enabled in Options
    'isNativeTitleBarEnabled': async() => {
        return await _.getOption('nativeTitleBarVisible') === 'true'
    },
    
    // Retrieves current Trilium theme from becca
    'getCurrentTheme': async () => {
        return await _.getOption('theme')
    },

    // Retrieves user themes
    'getThemes': async () => {
        return await api.searchForNotes('#appTheme =* ')
    },

    // Retrieves user themes object
    'getUserThemes': async (variantMap) => {
        let userThemes = {}
        let themes = await _.getThemes()
        for (let i = 0; i < themes.length; i++) {
            let themeId = themes[i].getAttributeValue('label', 'appTheme')
            userThemes[themeId] = await _.getTheme(themeId, variantMap)
        }
        return userThemes
    },

    'getThemeVariant': (theme, variantMap) => {
        let variant = theme.id.split('-')
        if ( !(variant instanceof Array) ) variant = [variant]
        variant = variant[variant.length-1]
        if ( variant === 'dark' ) {
            return 'dark'
        } else if ( variant === 'light' ) {
            return 'light'
        } else {
            return variantMap?.[theme.id]?.variant
        }
    },

    // Retrieves current theme ID and Name
    'getTheme': async (themeId, variantMap) => {
        const styleSheetsPath = 'assets/v' + _.appInfo.appVersion + '/stylesheets/'
        const apiNotePrefix = 'api/notes/download/'
        let theme, themeName, themeType='user', themeContent
        if( Object.keys(_.builtinThemes).includes(themeId)) {
            themeType = 'built-in'
            theme = _.builtinThemes[themeId]
        } else {
            let themes = await api.searchForNotes('#appTheme="' + themeId + '"')
            theme = themes?.[0]
            if (theme) {
                theme.variant = _.getThemeVariant({id: themeId}, variantMap) || 'light'   // Defaults to light mode
                let themeBaseId = themeId.replace(new RegExp('-'+theme.variant+'$'), '')
                theme.styleSheet = _.styleSheetPath.user + theme.noteId
                theme.variants = {}
                //let variants = await api.searchForNotes('#appTheme =* "' + themeBaseId + '-"') // Starts with
                let variants = await api.searchForNotes('#appTheme =* "' + themeBaseId + '"') // Starts with
                for (let i = 0; i < variants.length; i++) {
                    let v = variants[i]
                    let tId = v.getAttributeValue('label', 'appTheme')
                    if (tId !== themeId) {
                        let variant = tId.replace(themeBaseId + '-', '')   // || "light" ? to handle base as light?
                        theme.variants[variant] = {
                            id: themeBaseId+'-'+variant, noteId: v.noteId, styleSheet: _.styleSheetPath.user + v.noteId
                        }
                    }
                }
                if (Object.keys(theme.variants).length===0) {
                    console.warn('No theme variant found!')
                    let variant = theme.variant === 'dark' ? 'light' : 'dark'
                    let variantThemeId = variantMap[themeId]?.[variant]
                    if (variantThemeId) {
                        let variantTheme = (await api.searchForNotes('#appTheme="' + variantThemeId + '"'))?.[0]
                        theme.variants[variant] = {
                            id: variantThemeId, noteId: variantTheme.noteId, styleSheet: _.styleSheetPath.user + variantTheme.noteId
                        }
                    }
                }
            }
        }
        return {
            id: theme?.id || themeId,
            noteId: theme?.noteId,
            title: theme?.title,
            type: themeType,
            variant: theme?.variant,
            variants: theme?.variants,
            styleSheet: theme?.styleSheet,
        }
    },

    // Get Stylesheet
    'getStylesheet': async (stylesPath, themeName, defaultThemeName, note) => {
        let stylesheet = ''
            //id = note.title.toLowerCase().replace(/[^a-z0-9]/gi, '-')
        // Get styles from widget (global note)
        stylesPath = stylesPath.split('/')
        let stylesFolder = api.startNote
        for (const path of stylesPath) {
            stylesFolder = (await stylesFolder.getChildNotes()).filter( child => child.title === path)[0]
        }
        const globalChildren = await stylesFolder.getChildNotes()
        let globalStyles = globalChildren.filter(n => n.mime === 'text/css' && n.title === themeName)
        if (globalStyles.length === 0) globalStyles = globalChildren.filter(n => n.mime === 'text/css' && n.title === defaultThemeName)
        stylesheet += await globalStyles[0].getContent()

        // Get styles from current note
        if (note && this.isEnabled(note)) {
            const localChildren = await note.getChildNotes()
            let localStyles = localChildren.filter(n => n.mime === 'text/css' && n.title === themeName)
            if (localStyles.length === 0) localStyles = localChildren.filter(n => n.mime === 'text/css' && n.title === defaultThemeName)
            stylesheet += await localStyles[0].getContent()
        }
        return stylesheet
    },

    'getCssContent': async () => {
        let childNotes = await api.startNote.getChildNotes()
        let cssNotes = childNotes.filter( (childNote) => _.isCssNote(childNote) )
        let cssNote
        if (cssNotes.length > 1) console.warn(`Found ${cssNotes.length} child CSS files. Using the first one!`)
        if (cssNotes.length === 0) {
            console.warn('No CSS child note found!')
        } else {
            cssNote = await api.getNote(cssNotes[0].noteId)
        }
        return await cssNote.getContent()
    },

    'getHtmlContent': async () => {
        let childNotes = await api.startNote.getChildNotes()
        let htmlNotes = childNotes.filter( (childNote) => childNote.title === 'html' )
        let htmlNote
        if (htmlNotes.length > 1) console.warn(`Found ${htmlNotes.length} child HTML files. Using the first one!`)
        if (htmlNotes.length === 0) {
            console.warn('No HTML child note found!')
        } else {
            htmlNote = await api.getNote(htmlNotes[0].noteId)
        }
        return await htmlNote.getContent()
    },

    'getDropdownHtmlContent': async () => {
        let childNotes = await api.startNote.getChildNotes()
        let htmlNotes = childNotes.filter( (childNote) => childNote.title === 'dropdown' )
        let htmlNote
        if (htmlNotes.length > 1) console.warn(`Found ${htmlNotes.length} child HTML files. Using the first one!`)
        if (htmlNotes.length === 0) {
            console.warn('No HTML child note found!')
        } else {
            htmlNote = await api.getNote(htmlNotes[0].noteId)
        }
        return await htmlNote.getContent()
    },

    // Returns date object based on time string and given date (or current date if given date is not provided)
    'getTime': (strTime, date) => {
        let mod
        // Returns null if provided time data is not a string or is empty
        if ( (typeof strTime !== 'string') || !strTime) return null
        // Prepares the string (removes all whitespaces, converts to all caps)
        strTime = strTime.toUpperCase().trim().replace(/\s+/g, '')
        // Converts the time string to 24-hour format (if needed)
        if (strTime.slice(-2) === 'PM') {
            strTime = strTime.slice(0, -2)
            mod = 'PM'
        } else if (strTime.slice(-2) === 'AM') {
            strTime = strTime.slice(0, -2)
            mod = 'AM'
        }

        // Parses time part and miliseconds part
        let [hms, ms] = strTime.split('.')
        // Extracts hours, minutes and seconds
        let [h, m, s] = hms.split(':')

        // Verifies that the time data is valid
            // Returns null if miliseconds (if parsed) is not a number
            if (isNaN(ms||0) ) return null
            // Returns null if time string is not a number (ex: 02:14:12 '> 021412)
            if (isNaN(hms.replace(/\:/g,'')) ) return null

        // If hours are 12 AM, converts hours to 0
        if (mod === 'AM' && h === '12') h = '00'
        // Adds 12 hours if PM (modulus makes sure that the hours are not greater than 12 when used with PM)
        if (mod === 'PM') h = parseInt(h%12, 10) + 12
    
        let datetime = new Date(date.getTime());
        return datetime.setHours(h || 0, m || 0, s || 0, ms || 0)
    },

    'getDarkVariantTimeRange': (configuration, time) => {
        let start = _.getTime(configuration.start, time)
        let end = _.getTime(configuration.end,   time)
        return {
            startTs: _.getTime(configuration.start, time),
            endTs:   _.getTime(configuration.end,   time),
        }
    },

    'getDarkTimePollRate': (configuration) => {
        let pollRate = configuration.pollInSeconds
        if (pollRate === undefined || pollRate === null) pollRate = 30
        if (pollRate < 10 ) pollRate = 30
        return pollRate * 1000
    },

    'isDarkTime': (now, darkVariantTimeRange) => {
        now = now || new Date()
        let darkRange = _.getDarkVariantTimeRange(darkVariantTimeRange, now)
        let darkTimeStart = (new Date(darkRange.startTs))
        let darkTimeEnd   = (new Date(darkRange.endTs))
        // Adding 1 day if the range is spanning over midnight
        if (darkTimeEnd < darkTimeStart) darkTimeEnd.setDate(darkTimeEnd.getDate() + 1/*day*/);
        if (darkTimeStart <= now && now < darkTimeEnd) return true
        return false
    },

    'getThemeOfTimeRange': (now, darkVariantTimeRange) => {
        now = now || new Date()
        if (_.isDarkTime(now, darkVariantTimeRange)) return 'dark'
        return 'light'
    },

    'isAppReloaded': () => {
        let data = window.performance.getEntriesByType("navigation")[0].type
        if ( data === 'reload' ) { return true } else { return false }
    },

    'isAppStart': () => {
        let data = window.performance.getEntriesByType("navigation")[0].type
        if ( data === 'navigate' ) { return true } else { return false }
    },

     'reloadFrontend': () => {
        location.reload()
    },

}


_.appInfo = await _.getAppInfo()

_.styleSheetPath = {
    'builtin': 'assets/v' + _.appInfo.appVersion + '/stylesheets/',
    'user': 'api/notes/download/',
}

_.builtinThemes = {
    'light': {
        id: 'light',
        title: 'Light',
        variant: 'light',
        styleSheet: _.styleSheetPath.builtin + 'theme-light.css',
        variants: {
            'dark': { id: 'dark', styleSheet: _.styleSheetPath.builtin + 'theme-dark.css' }
        }
    },
    'dark': {
        id: 'dark',
        title: 'Dark',
        variant: 'dark',
        styleSheet: _.styleSheetPath.builtin + 'theme-dark.css',
        variants: {
            'light': { id: 'light', styleSheet: _.styleSheetPath.builtin + 'theme-light.css' }
        }
    },
}

_.defaultTheme = _.builtinThemes['light']


module.exports = _