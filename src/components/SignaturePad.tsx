import React, { useRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import { X, RotateCcw, Check } from "lucide-react";

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  onClear?: () => void;
  label?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClear, label }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const clear = () => {
    sigCanvas.current?.clear();
    if (onClear) onClear();
  };

  const save = () => {
    if (sigCanvas.current?.isEmpty()) return;
    const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL("image/png");
    if (dataUrl) onSave(dataUrl);
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-semibold text-zinc-700">{label}</label>}
      <div className="border border-zinc-200 rounded-xl overflow-hidden bg-zinc-50">
        <SignatureCanvas
          ref={sigCanvas}
          penColor="black"
          canvasProps={{
            className: "w-full h-40 cursor-crosshair"
          }}
        />
        <div className="flex items-center justify-between p-2 bg-white border-t border-zinc-200">
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Clear
          </button>
          <button
            type="button"
            onClick={save}
            className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <Check className="w-3 h-3" />
            Confirm Signature
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;
