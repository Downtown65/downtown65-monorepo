import { Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';

interface StepDescriptionProps {
  value: string;
  onChange: (value: string) => void;
}

function ClientOnlyEditor({ value, onChange }: StepDescriptionProps) {
  const [mod, setMod] = useState<{
    RichTextEditor: typeof import('@mantine/tiptap').RichTextEditor;
    useEditor: typeof import('@tiptap/react').useEditor;
    StarterKit: typeof import('@tiptap/starter-kit').default;
    TiptapLink: typeof import('@tiptap/extension-link').default;
    Underline: typeof import('@tiptap/extension-underline').default;
  } | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    Promise.all([
      import('@mantine/tiptap'),
      import('@tiptap/react'),
      import('@tiptap/starter-kit'),
      import('@tiptap/extension-link'),
      import('@tiptap/extension-underline'),
    ])
      .then(([tiptapMantine, tiptapReact, starterKit, link, underline]) => {
        setMod({
          RichTextEditor: tiptapMantine.RichTextEditor,
          useEditor: tiptapReact.useEditor,
          StarterKit: starterKit.default,
          TiptapLink: link.default,
          Underline: underline.default,
        });
      })
      .catch(() => setLoadError(true));
  }, []);

  if (loadError)
    return <Text c="red">Editorin lataus epäonnistui. Yritä ladata sivu uudelleen.</Text>;
  if (!mod) return <Text c="dimmed">Ladataan editoria...</Text>;

  return <EditorInner value={value} onChange={onChange} mod={mod} />;
}

function EditorInner({
  value,
  onChange,
  mod,
}: StepDescriptionProps & {
  mod: {
    RichTextEditor: typeof import('@mantine/tiptap').RichTextEditor;
    useEditor: typeof import('@tiptap/react').useEditor;
    StarterKit: typeof import('@tiptap/starter-kit').default;
    TiptapLink: typeof import('@tiptap/extension-link').default;
    Underline: typeof import('@tiptap/extension-underline').default;
  };
}) {
  const editor = mod.useEditor({
    extensions: [mod.StarterKit, mod.TiptapLink, mod.Underline],
    content: value,
    autofocus: 'end',
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
  });

  const { RichTextEditor } = mod;

  return (
    <RichTextEditor editor={editor} mih={300}>
      <RichTextEditor.Toolbar sticky stickyOffset={60}>
        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Bold />
          <RichTextEditor.Italic />
          <RichTextEditor.Underline />
          <RichTextEditor.Code />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.H1 />
          <RichTextEditor.H2 />
          <RichTextEditor.H3 />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Hr />
          <RichTextEditor.Blockquote />
          <RichTextEditor.BulletList />
          <RichTextEditor.OrderedList />
        </RichTextEditor.ControlsGroup>

        <RichTextEditor.ControlsGroup>
          <RichTextEditor.Link />
          <RichTextEditor.Unlink />
        </RichTextEditor.ControlsGroup>
      </RichTextEditor.Toolbar>

      <RichTextEditor.Content />
    </RichTextEditor>
  );
}

export function StepDescription({ value, onChange }: StepDescriptionProps) {
  return (
    <>
      <Title order={3} mb="md">
        Kuvaus
      </Title>
      <ClientOnlyEditor value={value} onChange={onChange} />
    </>
  );
}
