const settings = {
    label: {
        installed:            'installed',
        widget:               'widget',
        readOnly:             'readOnly',
        hideChildrenOverview: 'hideChildrenOverview',
    }
}

const addNoteLabel = async(note, labelName) => {
    if ( !note.hasLabel(labelName) ) {
        let bAttr = await api.runAsyncOnBackendWithManualTransactionHandling(async (params) => {
            let note = api.getNote(params.noteId)
            return await note.addLabel(params.labelName)
        }, [{noteId: note.noteId, labelName: labelName}])
        if (bAttr) console.log(`Added label '${labelName}' to '${note.title} note'`)
    }
}

const installer = api.currentNote
const widget    = installer.getParentNotes()[0]

const installed = installer.hasLabel(settings.label.installed)
const disabled  = installer.hasLabel(settings.label.disabled)

if (!disabled && !installed) {
    if (!widget.hasLabel(settings.label.widget)) addNoteLabel(widget, settings.label.widget)
    if (!widget.hasLabel(settings.label.readOnly)) addNoteLabel(widget, settings.label.readOnly)
    if (!widget.hasLabel(settings.label.hideChildrenOverview)) addNoteLabel(widget, settings.label.hideChildrenOverview)
    if (!installer.hasLabel(settings.label.readOnly)) addNoteLabel(installer, settings.label.readOnly)
    addNoteLabel(installer, settings.label.installed)
    location.reload()
}