import React, { useState } from "react";
import PropTypes from 'prop-types';
import Dialog from '@mui/material/Dialog';
import { makeStyles } from '@mui/styles';
import { color } from "highcharts";
import NewChip from "../../../components/newChip/NewChip";

const EnvAndUserGroupNew = (props) => {
    const classes = useStyles();
    const { open, handleClose } = props;

    // Sample data - replace with your actual data
    const executionData = [
        {
            service: 'Service-1', status: <NewChip
                label={"Failed"}
                variant={"error"}
                shape="standard"

            />, reason: 'Canary is Already Running Via Pipeline: New_2024'
        },
        {
            service: 'Service-2', status: <NewChip
                label={"DIDN'T RUN"}
                variant={"light"}
                shape="standard"

            />, reason: '-'
        },
        {
            service: 'Service-3', status: <NewChip
                label={"DIDN'T RUN"}
                variant={"light"}
                shape="standard"

            />, reason: '-'
        },
    ];

    return (
        <Dialog
            fullWidth={true}
            maxWidth={'md'}
            open={open}
            onClose={handleClose}
            className={`${classes.root} dialog-align-corner`}
            aria-labelledby="max-width-dialog-title"
        >
            <div className='d-grid ml-auto dialog-sub-component' style={{ gridTemplateColumns: '396px 650px' }}>
                {
                    <div className={'left-panel-dialog-down'}>
                    </div>
                }
                <div className='right-panel-dialog bg-white'>
                    <>
                        <div className='font-18 font-weight-600 color-white d-flex align-center space-between' style={{ backgroundColor: '#0086ff', padding: '13.5px 20px' }}>
                            <p>Manage Failure</p>

                            <button
                                className='btn float-cancel-button'
                                style={{ left: '396px' }}
                                onClick={handleClose}
                            >
                                <span className='ri-close-line'></span>
                            </button>
                        </div>
                        <div className='d-flex align-center space-between' style={{ padding: '20px 20px' }}>
                            <p>Job has failed with the following details:</p>
                        </div>

                        {/* Table Section */}
                        <div className="body-panel-new-one" style={{ padding: '0 20px 80px 20px' }}>
                            <div className={classes.tableContainer}>
                                <div className={classes.tableHeader}>

                                    <span className={classes.headerTitle}>
                                        Execution details for deploy job
                                    </span>
                                    <span className={classes.stagingBadge}>
                                        <NewChip
                                            label={"Staging"}
                                            variant={"highlight2"}
                                            shape="standard"

                                        />
                                    </span>

                                </div>

                                <table className={classes.table}>
                                    <thead>
                                        <tr>
                                            <th>Service</th>
                                            <th>Status</th>
                                            <th>Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {executionData.map((row, index) => (
                                            <tr key={index}>
                                                <td>{row.service}</td>
                                                <td>
                                                    <span className={row.status === 'FAILED' ? classes.statusFailed : classes.statusDidntRun}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {row.reason !== '-' ? (
                                                        <>
                                                            {row.reason.split('New_2024')[0]}
                                                            {row.reason.includes('New_2024') && (
                                                                <span className={classes.linkText}>New_2024</span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        row.reason
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div>
                                <div className={classes.noteContainer}>
                                    <div className={classes.noteHeader}>
                                        <span className="ri-information-line font-24"></span>
                                        <span className={classes.noteTitle}>PLEASE NOTE</span>
                                    </div>

                                    <div className={classes.noteBody}>
                                        <p>
                                            On pipeline failure, there are three ways of recovering from failure.
                                        </p>

                                        <ol>
                                            <li>Re-run the failed job</li>
                                            <li>Continue to next job with failure</li>
                                            <li>Complete Rollback to baseline</li>
                                        </ol>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div className='footer-right-panel d-flex align-center justify-end' style={{ gap: '5px' }}>
                            <button className='btn btn-outlined d-flex align-center justify-center btn-semi-bold' style={{ color: '#124D9B' }}>CONTINUE WITH FAILURE</button>
                            <button className='btn btn-secondary d-flex align-center justify-center btn-semi-bold' style={{ backgroundColor: '#FEA111' }}>COMPLETE ROLLBACK</button>
                            <button className='btn btn-primary d-flex align-center justify-center btn-semi-bold' >RE-RUN JOB</button>
                        </div>
                    </>
                </div>
            </div>
        </Dialog>
    );
};

EnvAndUserGroupNew.propTypes = {
    open: PropTypes.bool,
    handleClose: PropTypes.func,
}

export default EnvAndUserGroupNew;

const useStyles = makeStyles((theme) => ({
    root: {
        '&.dialog-align-corner': {
            '& .MuiPaper-root': {
                maxWidth: '1100px'
            }
        },
        '& .input-with-icon': {
            position: 'relative',
            '& .cent-icon': {
                width: '40px',
                height: '44px',
                backgroundColor: '#fafafa',
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 500,
                top: '22px',
                right: '1px',
                borderRadius: '0px 4px 4px 0px',
                borderLeft: '1px solid #b7b7b7'
            }
        },
        '& .left-panel-dialog': {
            width: '396px',
            transition: 'width 5s',
            '& .left-panel-header': {
                borderBottom: '1px solid #f1f1f1'
            },
            '& .checkbox-only-divi': {
                position: 'absolute',
                bottom: '10px'
            },
        },
        '& .left-panel-dialog-down': {
            width: '0px',
            overflow: 'hidden',
            transition: `'width 5s', 'overflow 1s'`,
        },
        '& .body-panel-new-one': {
            padding: '10px 16px',
            height: 'calc(100vh - 120px)',
            overflowY: 'auto',
            position: 'relative',
        },
        '& .footer-right-panel': {
            //backgroundColor: '#fafafa',
            padding: '16px',
            position: 'absolute',
            bottom: '0px',
            width: '650px',
            '& .btn-semi-bold': {
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 600,
                fontSize: '12px',
                textTransform: 'uppercase',
                lineHeight: '1',
                height: '40px',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                textShadow: '0px 2px 1px rgba(0, 0, 0, 0.25)'
            },
            '& .btn-outlined': {
                backgroundColor: '#ffffff',
                border: '1px solid #9DC0EE',
                textShadow: 'none'
            },
        }
    },
    tableContainer: {
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        overflow: 'hidden',
    },
    noteContainer: {
        border: '1px solid #e0e0e0',
        borderRadius: '4px',
        overflow: 'hidden',
        marginTop: '24px',
        background: '#DFEDFF'
    },
    tableHeader: {
        //backgroundColor: 'none',
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        borderBottom: '1px solid #e0e0e0',
        fontSize: '14px',
        fontWeight: 600,
        //width:'521px'
    },
    noteHeader: {
        //backgroundColor: 'none',
        display: 'flex',
        alignItems: 'center',
        color: '#0086FF',
        padding: '12px 16px',
        //borderBottom: '1px solid #e0e0e0',
        fontSize: '14px',
        fontWeight: 700,
        //width:'521px'
    },
    headerContent: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
    },
    headerTitle: {
        fontSize: '14px',
        fontWeight: 600,
        color: '#333',

    },
    noteTitle: {
        fontSize: '14px',
        fontWeight: 600,
        color: '#0086FF',
        marginLeft: '10px'

    },
    noteBody: {
        padding: '0 16px 16px 41px',
        fontSize: '13px',
        color: '#0086FF',
        marginLeft: '10px',

        '& p': {
            margin: '0 0 8px 0',
        },

        '& ol': {
            paddingLeft: '16px',
            margin: 0,
        },

        '& li': {
            marginBottom: '6px',
            color: '#0086FF',
            cursor: 'pointer',
        },
    },



    stagingBadge: {
        //backgroundColor: '#FFE8F5',
        marginLeft: 'auto',
        //color: '#E91E8C',
        fontSize: '12px',
        fontWeight: 700,
        padding: '2px 8px',
        //borderRadius: '3px',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        '& thead': {
            backgroundColor: '#fafafa',
            '& th': {
                padding: '12px 16px',
                textAlign: 'left',
                fontSize: '12px',
                fontWeight: 700,
                color: '#2F2F2F',
                borderBottom: '1px solid #e0e0e0',
            }
        },
        '& tbody': {
            '& tr': {
                borderBottom: '1px solid #e0e0e0',
                '&:last-child': {
                    borderBottom: 'none',
                }
            },
            '& td': {
                padding: '12px 16px',
                fontSize: '13px',
                color: '#333',
            }
        }
    },
    statusFailed: {
        color: '#E53935',
        fontWeight: 600,
        fontSize: '12px',
    },
    statusDidntRun: {
        color: '#999',
        fontWeight: 600,
        fontSize: '12px',
    },
    linkText: {
        color: '#0086ff',
        cursor: 'pointer',
        '&:hover': {
            textDecoration: 'underline',
        }
    }
}));
