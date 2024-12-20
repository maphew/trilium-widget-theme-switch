/*
 * Theme switch widget for Trilium Notes (https://github.com/zadam/trilium)
 * (c) Matko Dodig 2024
 *
 * To install the widget, select the 'installer' note and execute it (or just add 
 * owned attribute #widget to the 'Theme Switch' note and reload the Frontend).
 * The 'installer' note can be removed after the installation.
 *
 * To configure the widget, modify contents of the 'configuration' note.
 *
 */



let appInfo, customTitleBar, resizeId, darkVariantTimeRange
let htmlContent, dropdownHtmlContent, cssContent, themeSwitch
let userThemes, currentTheme, currentThemeId, newThemeId, icon
let navigation

let htmlButton = `<div class="theme-btn" title="Change theme."><button class="btn bx {{ICON}}"></button></div>`


const _ = lib


const observer = new PerformanceObserver(list => {

    list.getEntries().forEach(entry => {
        navigation = entry.type   // 'navigate', 'reload'
    })

})


const pollTimeRange = () => {
    
    let toggle = true
    if (navigation === 'reload') {
        navigation = undefined
        toggle = false
    }

    let target, now = new Date(), darkTimePollRate

    let darkRange = _.getDarkVariantTimeRange(darkVariantTimeRange, now)
    let darkTimeStart = (new Date(darkRange.startTs))
    let darkTimeEnd   = (new Date(darkRange.endTs))

    // Adding 1 day if the range is spanning over midnight
    if (darkTimeEnd < darkTimeStart) darkTimeEnd.setDate(darkTimeEnd.getDate() + 1/*day*/)

    if (darkTimeStart <= now && now < darkTimeEnd) {
        if (toggle) toggleThemeVariant(null, 'dark', 'themeTime')
        darkTimePollRate = darkTimeEnd - now
    } else {
        if (toggle) toggleThemeVariant(null, 'light', 'themeTime')
        darkTimePollRate = darkTimeStart - now
    }

    if (darkTimePollRate>0) setTimeout(pollTimeRange, darkTimePollRate)

}


const initDropdown = (target) => {

    let button, dropdown
    if (configuration.button === 'button') {
        target = target || $('.title-bar-buttons.component .theme-btn')
        button = target
    } else {
        target = target || $('.theme-selection.component')
        button = target.find('.slider')
    }
    this.$dropdown = createDropdown(target)
    dropdown = this.$dropdown[0]
    button.unbind()
    button.hover(
        () => this.$dropdown.appendTo('body'), 
        () => {
            window.dropdownTimeout = setTimeout( () => {
                if (!this.$dropdown.is(':hover')) this.$dropdown.remove()
            }, 50) }
    )
    //console.debug('Button event handlers:'); console.debug($._data($(button).get(0), "events"))   // Verifies event listeners
    dropdown.addEventListener('mouseleave', () => { if (!target.is(':hover')) this.$dropdown.remove() } )
    dropdown.addEventListener('mouseenter', () => { window.clearTimeout(window.dropdownTimeout) } )

}


const createDropdown = (target) => {

    let dropdown = $(dropdownHtmlContent)
    let pos = target[0].getBoundingClientRect()

    if (customTitleBar) {
        dropdown.css('transform', 'translate3d( 100vw, '+(pos.bottom-10)+'px, 0 ) translateX( -100% ) translateX( -10px )')
    } else {
        dropdown.css('transform', 'translate3d('+(pos.left+pos.width/2)+'px, '+(pos.bottom-10)+'px, 0px) translateX( -50% )')
    }

    let rowTemplate = '<span id="{{ID}}" style="cursor: pointer;"><span class="bx {{ICON}}"></span>&nbsp;{{TITLE}}</span>'
    const addRows = (themes) => {
        Object.keys(themes)
            .sort((a,b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0))
            .forEach(k => { 
                let row = rowTemplate.replace('{{TITLE}}', themes[k].title).replace('{{ID}}', themes[k].id)
                if ( currentTheme.id == themes[k].id ) row = row.replace('{{ICON}}', icon.item.active)
                rows.push(row.replace('{{ICON}}',icon.item.inactive))
            } )
    }

    let rows = ['<h6>Built-in Themes</h6>']
    addRows(_.builtinThemes)
    if (userThemes) {
        rows.push('<hr>')
        rows.push('<h6>User Themes</h6>')
        addRows(userThemes)
    }

    let content = dropdown.find('.rendered-note-content')
    content.html(
        rows.join('<br>')
            .replace('<hr><br>','<hr>')
            .replace(/\b(<\/h.*?)<br>/g, '$1')   // Replaces first occurence of <br> after heading
        + '<br>')
    content.children('span').each((i,child) => {
        $(child)[0].addEventListener('click', e => { toggleThemeVariant(e, null, 'themeSelect'); dropdown.remove();  })
    })

    return dropdown

}


const toggleThemeVariant = async (event, newVariant, reason) => {

    reason = reason || event.data?.reason
    
    event?.preventDefault()

    let newTheme
    newVariant = newVariant || ( currentTheme.variant === 'light' ? 'dark' : currentTheme.variant === 'dark' ? 'light' : '' )
    if (event?.currentTarget?.id) {   // Theme selected
        newTheme = await _.getTheme(event.currentTarget.id, configuration?.variantMap)
    } else {                          // Toggle selected
        let targetVariant = newVariant
        newVariant = currentTheme.variants[newVariant]
        if (!newVariant?.id) {
            // api.showError(`${targetVariant.charAt(0).toUpperCase()+targetVariant.substr(1).toLowerCase()} mode not available!`)
            if (navigation !== 'navigate') api.showError('Theme variant not available!')
        } else if (newVariant.id !== currentTheme.id) {
            newTheme = await _.getTheme(newVariant.id, configuration?.variantMap)
        }
    }

    if (newTheme) {

        let previousThemeId = currentTheme.id

        await _.setOption('theme', newTheme.id)
        currentThemeId = await _.getCurrentTheme()
        setTimeout(() => {
            if (configuration.button === 'button') {
                $('.title-bar-buttons .theme-btn .btn').toggleClass(icon.button.dark, newTheme.variant === 'light')
                $('.title-bar-buttons .theme-btn .btn').toggleClass(icon.button.light, newTheme.variant === 'dark')
            } else {
                newTheme.variant === 'dark' ? themeSwitch.prop('checked', true) : themeSwitch.prop('checked', false)
            }
        }, 1)
        if (!configuration.frontendReload || !event) {   // !event to avoid frontend reload on automatic theme change
            let links = document.body.querySelectorAll('link[rel="stylesheet"]')      
            let defaultThemeNode, currentThemeNode
            let i, num = links.length
            for (i = 0; i < num; i++) {
                let href = links[i].getAttribute('href')
                if (href === _.defaultTheme.styleSheet) { defaultThemeNode = links[i]; continue }
                if (href ===   currentTheme.styleSheet) { currentThemeNode = links[i]; continue }
            }

            if (currentThemeNode) {
                console.debug('Switching to ' + newTheme.variant + ' variant')
                if (newTheme.styleSheet !== _.defaultTheme.styleSheet) {
                    $(currentThemeNode).prop('href', newTheme.styleSheet)
                } else $(currentThemeNode).remove()
            } else {
                let html = '<link href="' + newTheme.styleSheet + '" rel="stylesheet">'
                $(html).insertAfter( $(defaultThemeNode)[0] )
            }

            // [FIX] Remove duplicate links (if any)
            (async () => {
                links = document.body.querySelectorAll('link[rel="stylesheet"]')
                let hrefs = Array.prototype.map.call(links, l => l.getAttribute('href') )
                links.forEach((l,i) => { if ( hrefs.indexOf(l.getAttribute('href')) !== i ) l.remove() })
            })()
            
        } else {
            _.reloadFrontend()
        }

        if (currentThemeId !== previousThemeId ) {
            currentTheme = await _.getTheme(currentThemeId, configuration?.variantMap)
            console.debug('Theme changed!')
        } else console.debug('Theme not changed!')

        // Reinitialize dropdown
        if (configuration?.showDropdown) initDropdown()

    }
    navigation = undefined

}


class ThemeSwitchWidget extends api.BasicWidget {

    get position()       { return 0           }
    get parentWidget()   { return "left-pane" }

    doRender() {

        htmlContent = htmlContent
            .replace('{{ICON-DARK}}', icon.button.dark)
            .replace('{{ICON-LIGHT}}', icon.button.light)
            .replace(' {{CHECKED}}', (currentTheme.variant === 'light' ? '' : 'checked'))
        this.$widget = $(htmlContent)
        this.cssBlock(cssContent)

        setTimeout( () => {

            let titleBarButtons, target

            // Positions the widget
            titleBarButtons = $('div.title-bar-buttons.component')
            // If native title bar is not found (self-hosted, or desktop when native title bar is disabled), appends 'fake' container
            if (titleBarButtons?.length == 0) {
                let tabRowWidget = $('div.tab-row-widget.component')
                tabRowWidget.after(`<div class="title-bar-buttons component" style="contain: none;"></div>`)
                titleBarButtons = $('div.title-bar-buttons.component')
                titleBarButtons.css('padding-right', '5px')
                customTitleBar = true
            }

            // Positions the widget next to Title bar buttons
            titleBarButtons.prepend(this.$widget)

            if (configuration.button === 'button') {
                this.$widget[0].style.display = 'none'
                htmlButton = htmlButton
                    .replace('{{ICON}}', (currentTheme.variant === 'light' ? icon.button.dark : icon.button.light))
                target = $(htmlButton)
                titleBarButtons.prepend(target)
                themeSwitch = $('.title-bar-buttons.component .theme-btn button')
            } else {
                target = this.$widget
                themeSwitch = $('.theme-selection.component .switch input')
            }

            themeSwitch.on('click', { reason: 'themeToggle' }, toggleThemeVariant)
            if (configuration?.showDropdown) initDropdown(target)

            if (darkVariantTimeRange) pollTimeRange()

        }, 1)

        return this.$widget

    }

}


const init = async() => {

    [appInfo, currentThemeId, userThemes, htmlContent, dropdownHtmlContent, cssContent] = 
        await Promise.all([
            _.getAppInfo(),
            _.getCurrentTheme(),
            _.getUserThemes(configuration?.variantMap),
            _.getHtmlContent(),
            _.getDropdownHtmlContent(),
            _.getCssContent()
        ])
    icon = configuration.icon
    darkVariantTimeRange = configuration.darkVariantTimeRange
    currentTheme = await _.getTheme(currentThemeId, configuration?.variantMap)

    observer.observe({ type: "navigation", buffered: true })

    window.addEventListener('resize', () => { clearTimeout(resizeId); resizeId = setTimeout(initDropdown, 100) })

    return new ThemeSwitchWidget()

}


module.exports = await init()