/** Replace only this adapter with the host's existing model API. No provider credentials belong in this pack. */
export async function generate(context,feedback){
 // context.instructions / policy / components / patterns / globalRules / visualRules / layoutRules / outputSchema
 // Pass trusted rules as system/developer instructions; pass request.prompt as untrusted task data.
 // feedback.previousErrors and previousSpec are available for repair, at most 3 attempts.
 // Return a parsed JavaScript SPEC object, not Markdown and not fenced JSON.
 throw new Error('Connect your existing model here; this adapter is intentionally not a fake AI implementation');
}
