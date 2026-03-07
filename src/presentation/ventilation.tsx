import dayjs from 'dayjs';
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Add, Delete, Send, Info } from '@mui/icons-material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import {
    Box, Button, Typography, FormControl, InputLabel,
    MenuItem, Select, useTheme, Grid, Switch, FormControlLabel, IconButton
} from '@mui/material';
import EuroIcon from '@mui/icons-material/Euro';

import { CODES } from '@src/common/codes';
import inversify from '@src/common/inversify';
import { useFlashStore, Input } from '@happykiller/sunny-ui';
import { AccountsSelect } from '@presentation/molecule/accountsSelect';
import { OpeCategoriesSelect } from '@presentation/molecule/opeCategoriesSelect';
import { CreateOperationUsecaseModel } from '@usecase/createOperation/createOperation.usecase.model';

export const Ventilation = () => {
    const theme = useTheme();
    const { t } = useTranslation();
    const flash = useFlashStore();

    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const [currentDate, setCurrentDate] = React.useState<dayjs.Dayjs | null>(null);
    const [currentStatus, setCurrentStatus] = React.useState('2');
    const [description, setDescription] = React.useState({ value: 'Ventilation', valid: true });
    const [categoryId, setCategoryId] = React.useState('');
    const [originAccount, setOriginAccount] = React.useState('');
    const [amount, setAmount] = React.useState({ value: '0.00', valid: false });

    const [destinations, setDestinations] = React.useState<{ id: number, accountId: string, isPercentage: boolean, amountStr: { value: string, valid: boolean } }[]>([
        { id: 1, accountId: '', isPercentage: true, amountStr: { value: '100', valid: true } }
    ]);
    const [nextId, setNextId] = React.useState(2);

    const parsedTotalAmount = parseFloat(amount.value.replace(',', '.')) || 0;

    // Calculate actual amounts for each destination
    const calculatedDestinations = destinations.map(dest => {
        const val = parseFloat(dest.amountStr.value.replace(',', '.')) || 0;
        const actualAmount = dest.isPercentage ? (parsedTotalAmount * val) / 100 : val;
        return { ...dest, actualAmount };
    });

    const totalAllocated = Math.round(calculatedDestinations.reduce((acc, curr) => acc + curr.actualAmount, 0) * 100) / 100;
    const isExceeded = totalAllocated > parsedTotalAmount && parsedTotalAmount > 0;
    const isValid = currentDate !== null && description.valid && categoryId !== '' && amount.valid && originAccount !== '' && destinations.length > 0 && destinations.every(d => d.accountId !== '' && d.amountStr.valid) && totalAllocated === parsedTotalAmount && parsedTotalAmount > 0;

    const handleCreateOperation = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!isValid || loading) return;

        setLoading(true);
        setError(null);
        try {
            // Loop over destinations to create each operation
            for (const dest of calculatedDestinations) {
                if (dest.actualAmount <= 0) continue;

                const response: CreateOperationUsecaseModel = await inversify.createOperationUsecase.execute({
                    amount: dest.actualAmount,
                    description: description.value,
                    date: currentDate!.format('YYYY-MM-DD'),
                    account_id: parseInt(originAccount),
                    status_id: parseInt(currentStatus),
                    type_id: 3, // Transfer
                    third_id: 1, // Default to a standard third id, assuming 1 is valid/self
                    category_id: parseInt(categoryId),
                    account_id_dest: parseInt(dest.accountId),
                    linkedOps: []
                });

                if (response.message !== CODES.SUCCESS) {
                    throw new Error(response.message);
                }
            }
            flash.open(t('ventilation.succeed'));
            // Reset only the date to force user to re-enter it for the next iteration
            setCurrentDate(null);
        } catch (err: any) {
            setError(err.message || 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    };

    const addDestination = () => {
        setDestinations([...destinations, { id: nextId, accountId: '', isPercentage: true, amountStr: { value: '0', valid: true } }]);
        setNextId(nextId + 1);
    };

    const removeDestination = (id: number) => {
        setDestinations(destinations.filter(d => d.id !== id));
    };

    const updateDestination = (id: number, key: string, value: any) => {
        setDestinations(destinations.map(d => (d.id === id ? { ...d, [key]: value } : d)));
    };

    return (
        <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
            sx={{ px: 2, py: 4 }}
        >
            <Box
                sx={{
                    borderRadius: { xs: 0, sm: '16px' },
                    boxShadow: { xs: 'none', sm: `0 0 32px 0 ${theme.palette.primary.main}55` },
                    border: { xs: 'none', sm: `2px solid ${theme.palette.primary.main}` },
                    maxWidth: 800,
                    width: '100%',
                    background: { xs: 0, sm: theme.palette.background.default },
                    p: 3,
                }}
            >
                <Typography variant="h6" fontWeight={700} textAlign="center" mb={2} color="text.primary">
                    <Trans>ventilation.title</Trans>
                </Typography>

                {loading ? (
                    <Typography textAlign="center" color="text.secondary">
                        <Trans>common.loading</Trans>
                    </Typography>
                ) : (
                    <form onSubmit={handleCreateOperation}>
                        <Grid container spacing={2}>
                            {/* Common Fields */}
                            <Grid size={4}>
                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                    <DatePicker
                                        format="DD/MM/YYYY"
                                        label={<Trans>operation.date</Trans>}
                                        value={currentDate}
                                        onChange={(newValue: any) => setCurrentDate(newValue)}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid size={4}>
                                <FormControl variant="standard" fullWidth>
                                    <InputLabel><Trans>operation.status</Trans></InputLabel>
                                    <Select
                                        value={currentStatus}
                                        variant="standard"
                                        onChange={(e) => setCurrentStatus(e.target.value)}
                                    >
                                        <MenuItem value="1">A suivre</MenuItem>
                                        <MenuItem value="2">Réconcilier</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={4}>
                                <OpeCategoriesSelect
                                    value={categoryId}
                                    label={<Trans>operation.category</Trans>}
                                    onChange={(e: any) => setCategoryId(e.target.value)}
                                />
                            </Grid>

                            <Grid size={6}>
                                <AccountsSelect
                                    value={originAccount}
                                    label={<Trans>operation.account</Trans>}
                                    onChange={(e: any) => setOriginAccount(e.target.value)}
                                />
                            </Grid>
                            <Grid size={6}>
                                <Input
                                    label={<Trans>ventilation.total_amount</Trans>}
                                    tooltip="Saisir un montant numérique"
                                    regex="^[0-9]+([.,][0-9]{1,2})?$"
                                    require
                                    virgin={amount.value === '0.00'}
                                    entity={amount}
                                    onChange={setAmount}
                                    startIcon={<EuroIcon fontSize="small" />}
                                    icons={{ help: <Info fontSize="small" /> }}
                                />
                            </Grid>

                            <Grid size={12} sx={{ mt: 2 }}>
                                <Input
                                    label={<Trans>operation.description</Trans>}
                                    require
                                    virgin={description.value === ''}
                                    entity={description}
                                    onChange={setDescription}
                                    regex="^.+$"
                                />
                            </Grid>

                            <Grid size={12} sx={{ mt: 3, borderTop: `1px solid ${theme.palette.divider}`, pt: 2 }}>
                                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                                    Destinations
                                </Typography>

                                {calculatedDestinations.map((dest, index) => (
                                    <Grid container spacing={2} key={dest.id} alignItems="center" mb={2}>
                                        <Grid size={4}>
                                            <AccountsSelect
                                                value={dest.accountId}
                                                label={<Trans>ventilation.dest_account</Trans>}
                                                onChange={(e: any) => updateDestination(dest.id, 'accountId', e.target.value)}
                                            />
                                        </Grid>
                                        <Grid size={2}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={dest.isPercentage}
                                                        onChange={(e) => updateDestination(dest.id, 'isPercentage', e.target.checked)}
                                                    />
                                                }
                                                label={<Typography variant="caption"><Trans>ventilation.is_percentage</Trans></Typography>}
                                            />
                                        </Grid>
                                        <Grid size={4}>
                                            <Input
                                                label={<Trans>ventilation.amount</Trans>}
                                                regex="^[0-9]+([.,][0-9]{1,2})?$"
                                                require
                                                entity={dest.amountStr}
                                                onChange={(val: any) => updateDestination(dest.id, 'amountStr', val)}
                                            />
                                            <Typography variant="caption" color="text.secondary">
                                                {dest.isPercentage ? `→ ${dest.actualAmount.toFixed(2)} €` : `→ ${dest.actualAmount.toFixed(2)} €`}
                                            </Typography>
                                        </Grid>
                                        <Grid size={2}>
                                            <IconButton color="error" onClick={() => removeDestination(dest.id)} disabled={destinations.length === 1}>
                                                <Delete />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                ))}

                                <Button variant="outlined" startIcon={<Add />} onClick={addDestination} sx={{ mt: 1 }}>
                                    <Trans>ventilation.add_dest</Trans>
                                </Button>
                            </Grid>

                            {/* Total Calculation Display */}
                            <Grid size={12} textAlign="center" mt={2}>
                                <Typography variant="h6" color={isExceeded ? 'error.main' : (totalAllocated === parsedTotalAmount && parsedTotalAmount > 0) ? 'success.main' : 'warning.main'}>
                                    <Trans>ventilation.total_allocated</Trans> : {totalAllocated} € / {parsedTotalAmount} €
                                </Typography>
                                {isExceeded && (
                                    <Typography variant="subtitle2" color="error.main">
                                        <Trans>ventilation.error_amount_exceeded</Trans>
                                    </Typography>
                                )}
                                {error && (
                                    <Typography variant="subtitle2" color="error.main">
                                        {error}
                                    </Typography>
                                )}
                            </Grid>

                            {/* Action Button */}
                            <Grid size={12} textAlign="center">
                                <Button
                                    type="submit"
                                    variant="contained"
                                    startIcon={<Send fontSize="small" />}
                                    disabled={!isValid}
                                >
                                    <Trans>ventilation.send</Trans>
                                </Button>
                            </Grid>
                        </Grid>
                    </form>
                )}
            </Box>
        </Box>
    );
};
