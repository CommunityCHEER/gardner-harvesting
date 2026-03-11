import React, { useContext } from 'react';
import { ActivityIndicator, Modal, Text, View } from 'react-native';
import Button from '@/components/Button';
import { i18nContext } from '@/i18n';

type SmartHarvestPhase = 'idle' | 'analyzing' | 'matched' | 'failed';

interface SmartHarvestOverlayProps {
    phase: SmartHarvestPhase;
    cropName: string | null;
    errorMessage: string | null;
    onAccept: () => void;
    onRetakePhoto: () => void;
    onChooseManually: () => void;
    onCancel: () => void;
}

export default function SmartHarvestOverlay({
    phase,
    cropName,
    errorMessage,
    onAccept,
    onRetakePhoto,
    onChooseManually,
    onCancel,
}: SmartHarvestOverlayProps) {
    const i18n = useContext(i18nContext);
    const t = i18n.t.bind(i18n);

    return (
        <Modal
            testID="smart-harvest-overlay"
            visible={phase !== 'idle'}
            transparent={true}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 20,
                }}
            >
                <View
                    style={{
                        width: '100%',
                        maxWidth: 380,
                        backgroundColor: 'white',
                        borderRadius: 16,
                        padding: 20,
                        alignItems: 'center',
                    }}
                >
                    {phase === 'analyzing' && (
                        <>
                            <ActivityIndicator size="large" />
                            <Text style={{ marginTop: 12, textAlign: 'center', fontSize: 18 }}>
                                {t('analyzingPhoto')}
                            </Text>
                            <Button title={t('cancel')} onPress={onCancel} />
                        </>
                    )}

                    {phase === 'matched' && (
                        <>
                            <Text style={{ textAlign: 'center', fontSize: 18, marginBottom: 8 }}>
                                {t('photoMatchedTo')}
                            </Text>
                            <Text
                                style={{
                                    textAlign: 'center',
                                    fontSize: 22,
                                    fontWeight: '600',
                                    marginBottom: 16,
                                }}
                            >
                                {cropName}
                            </Text>
                            <Button
                                title={t('useCrop', { cropName: cropName || '' })}
                                onPress={onAccept}
                            />
                            <Button title={t('takeADifferentPhoto')} onPress={onRetakePhoto} />
                            <Button title={t('chooseManually')} onPress={onChooseManually} />
                            <Button title={t('cancel')} onPress={onCancel} />
                        </>
                    )}

                    {phase === 'failed' && (
                        <>
                            <Text style={{ textAlign: 'center', fontSize: 18, marginBottom: 16 }}>
                                {errorMessage || t('noMatchFound')}
                            </Text>
                            <Button title={t('takeADifferentPhoto')} onPress={onRetakePhoto} />
                            <Button title={t('chooseManually')} onPress={onChooseManually} />
                            <Button title={t('cancel')} onPress={onCancel} />
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}