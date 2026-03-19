import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { X, Save, Trash2 } from "lucide-react";
import type { SquadPlayer } from "../types/squad";

interface PlayerEditModalProps {
  player: SquadPlayer | null;
  onClose: () => void;
  onSave: (player: SquadPlayer) => void;
  onDelete?: (playerId: string) => void;
  isNew?: boolean;
}

export function PlayerEditModal({ player, onClose, onSave, onDelete, isNew = false }: PlayerEditModalProps) {
  const [formData, setFormData] = useState<SquadPlayer>(
    player || {
      id: crypto.randomUUID(),
      name: "",
      number: 1,
      position: "Atacante",
      age: 20,
      nationality: "BRA",
      overallRating: 70,
      capitalEfficiency: 7.0,
      riskLevel: "MEDIUM",
      contractUntil: "2026-12",
      marketValue: "R$ 5M",
      stats: {
        pace: 70,
        shooting: 70,
        passing: 70,
        dribbling: 70,
        defending: 70,
        physical: 70,
      },
    }
  );

  const positions = [
    "Goleiro",
    "Lateral Esquerdo",
    "Lateral Direito",
    "Zagueiro",
    "Volante",
    "Meia Atacante",
    "Atacante",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleDelete = () => {
    if (player && onDelete && confirm(`Tem certeza que deseja remover ${player.name}?`)) {
      onDelete(player.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="bg-[#0A1B35] border-[rgba(0,194,255,0.3)] w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#00C2FF]">
              {isNew ? "Adicionar Novo Jogador" : `Editar Jogador: ${player?.name}`}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#00FF9C] mb-4">Informações Básicas</h3>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Nome Completo *</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-[#07142A] border-[rgba(0,194,255,0.3)] text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Número *</label>
                    <Input
                      type="number"
                      min="1"
                      max="99"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) })}
                      className="bg-[#07142A] border-[rgba(0,194,255,0.3)] text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Idade *</label>
                    <Input
                      type="number"
                      min="16"
                      max="45"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                      className="bg-[#07142A] border-[rgba(0,194,255,0.3)] text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Posição *</label>
                  <Select
                    value={formData.position}
                    onValueChange={(value) => setFormData({ ...formData, position: value })}
                  >
                    <SelectTrigger className="bg-[#07142A] border-[rgba(0,194,255,0.3)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {positions.map((pos) => (
                        <SelectItem key={pos} value={pos}>
                          {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Nacionalidade</label>
                    <Input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value.toUpperCase() })}
                      className="bg-[#07142A] border-[rgba(0,194,255,0.3)] text-white"
                      maxLength={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Overall (OVR) *</label>
                    <Input
                      type="number"
                      min="40"
                      max="99"
                      value={formData.overallRating}
                      onChange={(e) => setFormData({ ...formData, overallRating: parseInt(e.target.value) })}
                      className="bg-[#07142A] border-[rgba(0,194,255,0.3)] text-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Capital Efficiency (0-10)</label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={formData.capitalEfficiency}
                    onChange={(e) => setFormData({ ...formData, capitalEfficiency: parseFloat(e.target.value) })}
                    className="bg-[#07142A] border-[rgba(0,194,255,0.3)] text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Risk Level</label>
                  <Select
                    value={formData.riskLevel}
                    onValueChange={(value) => setFormData({ ...formData, riskLevel: value as "LOW" | "MEDIUM" | "HIGH" })}
                  >
                    <SelectTrigger className="bg-[#07142A] border-[rgba(0,194,255,0.3)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">LOW</SelectItem>
                      <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                      <SelectItem value="HIGH">HIGH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Contrato Até</label>
                    <Input
                      type="text"
                      value={formData.contractUntil}
                      onChange={(e) => setFormData({ ...formData, contractUntil: e.target.value })}
                      className="bg-[#07142A] border-[rgba(0,194,255,0.3)] text-white"
                      placeholder="2026-12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Valor de Mercado</label>
                    <Input
                      type="text"
                      value={formData.marketValue}
                      onChange={(e) => setFormData({ ...formData, marketValue: e.target.value })}
                      className="bg-[#07142A] border-[rgba(0,194,255,0.3)] text-white"
                      placeholder="R$ 10M"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column - Stats */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[#00FF9C] mb-4">Atributos (0-99)</h3>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Pace (Velocidade)</label>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={formData.stats.pace}
                    onChange={(e) => setFormData({
                      ...formData,
                      stats: { ...formData.stats, pace: parseInt(e.target.value) }
                    })}
                    className="bg-[#07142A] border-[rgba(0,194,255,0.3)] text-white"
                  />
                  <div className="mt-2 h-2 bg-[#07142A] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF4D4F] via-[#fbbf24] to-[#00FF9C]"
                      style={{ width: `${formData.stats.pace}%` }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Shooting (Finalização)</label>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={formData.stats.shooting}
                    onChange={(e) => setFormData({
                      ...formData,
                      stats: { ...formData.stats, shooting: parseInt(e.target.value) }
                    })}
                    className="bg-[#07142A] border-[rgba(0,194,255,0.3)] text-white"
                  />
                  <div className="mt-2 h-2 bg-[#07142A] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF4D4F] via-[#fbbf24] to-[#00FF9C]"
                      style={{ width: `${formData.stats.shooting}%` }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Passing (Passe)</label>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={formData.stats.passing}
                    onChange={(e) => setFormData({
                      ...formData,
                      stats: { ...formData.stats, passing: parseInt(e.target.value) }
                    })}
                    className="bg-[#07142A] border-[rgba(0,194,255,0.3)] text-white"
                  />
                  <div className="mt-2 h-2 bg-[#07142A] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF4D4F] via-[#fbbf24] to-[#00FF9C]"
                      style={{ width: `${formData.stats.passing}%` }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Dribbling (Drible)</label>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={formData.stats.dribbling}
                    onChange={(e) => setFormData({
                      ...formData,
                      stats: { ...formData.stats, dribbling: parseInt(e.target.value) }
                    })}
                    className="bg-[#07142A] border-[rgba(0,194,255,0.3)] text-white"
                  />
                  <div className="mt-2 h-2 bg-[#07142A] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF4D4F] via-[#fbbf24] to-[#00FF9C]"
                      style={{ width: `${formData.stats.dribbling}%` }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Defending (Defesa)</label>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={formData.stats.defending}
                    onChange={(e) => setFormData({
                      ...formData,
                      stats: { ...formData.stats, defending: parseInt(e.target.value) }
                    })}
                    className="bg-[#07142A] border-[rgba(0,194,255,0.3)] text-white"
                  />
                  <div className="mt-2 h-2 bg-[#07142A] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF4D4F] via-[#fbbf24] to-[#00FF9C]"
                      style={{ width: `${formData.stats.defending}%` }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Physical (Físico)</label>
                  <Input
                    type="number"
                    min="0"
                    max="99"
                    value={formData.stats.physical}
                    onChange={(e) => setFormData({
                      ...formData,
                      stats: { ...formData.stats, physical: parseInt(e.target.value) }
                    })}
                    className="bg-[#07142A] border-[rgba(0,194,255,0.3)] text-white"
                  />
                  <div className="mt-2 h-2 bg-[#07142A] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF4D4F] via-[#fbbf24] to-[#00FF9C]"
                      style={{ width: `${formData.stats.physical}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-700">
              <div>
                {!isNew && onDelete && (
                  <Button
                    type="button"
                    onClick={handleDelete}
                    variant="outline"
                    className="border-[#FF4D4F] text-[#FF4D4F] hover:bg-[#FF4D4F20]"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover Jogador
                  </Button>
                )}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-[#00FF9C] text-[#07142A] hover:bg-[#00e68a]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isNew ? "Adicionar Jogador" : "Salvar Alterações"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
