﻿using CTS.Result;
using eHospitalServer.Entities.DTOs;
using eHospitalServer.Entities.Models;

namespace eHospitalServer.Business.Services;
public interface IAppointmentService
{
    Task<Result<string>> CreateAsync(CreateAppointmentDto request, CancellationToken cancellationToken);
    Task<Result<string>> CompleteAppointmentAsync(CompleteAppointmentDto request, CancellationToken cancellationToken);
    Task<Result<List<Appointment>>> GetAllAppointmentByDoktorIdAsync(Guid doctorId, CancellationToken cancellationToken);
    Task<Result<User?>> FindPatientByIdentityNumberAsync(FindPatientDto request, CancellationToken cancellationToken);
    Task<Result<List<User>>> GetAllDoctorsAsync(CancellationToken cancellationToken);
    Task<Result<string>> DeleteByIdAsync (Guid id, CancellationToken cancellationToken);
}
