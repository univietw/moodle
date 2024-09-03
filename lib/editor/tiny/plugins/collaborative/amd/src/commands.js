/**
 * Handle the action for your plugin.
 * @param {TinyMCE.editor} editor The tinyMCE editor instance.
 */
const handleAction = (editor) => {
    // TODO Handle the action.
    window.console.log(editor);
};

export const getSetup = async() => {
    return (editor) => {
        // Register the startdemo Toolbar Button.
        editor.ui.registry.addButton("Toggle collaborative", {
            tooltip: "Toggle collaborative",
            onAction: () => handleAction(editor),
        });
    };
};