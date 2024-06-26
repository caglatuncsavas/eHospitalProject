import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DxSchedulerModule, DxTreeListModule } from 'devextreme-angular';
import { FormValidateDirective } from 'form-validate-angular';

import { UserModel } from '../../../models/user.model';
import { AppointmentModel } from '../../../models/appointment.modeL';
import { ResultModel } from '../../../models/result.model';
import { AppointmentDataModel } from '../../../models/appointment-data.model';
import { AuthService } from '../../../services/auth.service';
import { PatientAppointmentModel } from '../../../models/patient-appointment.model';


declare const $: any;

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    DxSchedulerModule,
    FormsModule,
    CommonModule,
    FormValidateDirective,
    DxTreeListModule
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {

  appointmentsData: any[] = [];
  selectedDoctorId: string = "";
  selectedPatientId: string = "";
  currentDate: Date = new Date();
  doctors: UserModel[] = [];
  patientAppointmentModel: PatientAppointmentModel[] = [];

  addModel: AppointmentModel = new AppointmentModel();
  appointmentData: AppointmentDataModel = new AppointmentDataModel();

  loginUserIsDoctor: boolean = false;
  loginUserIsPatient: boolean = false;

  showAppointments: boolean = false; // Randevu listesini gösterip göstermeme durumu

  selectedAppointment: any = null;
  epicrisisReport: string = '';

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) { 
   
  }


  ngOnInit(): void {


    if (this.auth.user.userType === "Doctor") {
      this.loginUserIsDoctor = true;
      this.selectedDoctorId = this.auth.user.userId;
      this.getDoctorAppointments();
    }
    debugger;
    if (this.auth.user.userType === "Patient") {
      this.loginUserIsPatient = true;
      this.selectedPatientId = this.auth.user.userId;
      this.getPatientAppointments();
      //Hastaya özel bir ekran göstermemiz lazım.Hastaya takvim yerine liste gösterilebilir.Card şeklinde.
    }
    else {
      this.getAllDoctors();
    }

  }

  onAppointmentClick(event: any) {
    const appointmentData = event.appointmentData;
  
  // Randevu zaten tamamlanmışsa veya epikriz raporu zaten varsa
  if (appointmentData.isItFinished) {
    alert('This appointment has already been completed.');
    return;
  } 
    this.selectedAppointment = appointmentData;
    this.showCompleteModal();
  
  }

  // Modalı gösterme işlevi
  showCompleteModal(): void {
    $('#completeAppointmentModal').modal('show');
  }

  closeCompleteModal(): void {
    $('#completeAppointmentModal').modal('hide');
  }

  completeAppointment(form: NgForm) {
    if (form.valid && this.selectedAppointment ) {

      //const result = confirm('Are you sure you want to complete this appointment?');
      const appointmentId = this.selectedAppointment.id;
      const report = this.epicrisisReport;
      this.http.post(`https://localhost:7204/api/Appointments/CompleteAppointment`, {
        appointmentId: appointmentId,
        epicrisisReport: report
      }).subscribe({
        next: (response) => {
          this.closeCompleteModal();
        },
        error: (error) => {
          console.error('Error completing appointment:', error);
          // Hata mesajı göster
          alert('An error occurred while completing the appointment.');
        }
      });
    }
     
  }

  // Hastanın Randevu listesini gösterip göstermeme durumunu değiştirir
  toggleAppointmentsDisplay(): void {
    this.showAppointments = !this.showAppointments;
  }

  getAllDoctors() {
    this.http.get("https://localhost:7204/api/Appointments/GetAllDoctors").subscribe((res: any) => {
      this.doctors = res.data
    })
  }

  getPatientAppointments() {
    if (this.selectedPatientId === "") return;

    this.http.get(`https://localhost:7204/api/Appointments/GetAllAppointmentByPatientId?patientId=${this.selectedPatientId}`).subscribe
    ((res: any) => {
      this.patientAppointmentModel = res.data.map((appointment: any) => ({
        id: appointment.appointmentId,
        doctorName: appointment.doctorName,
        doctorSpecialty: appointment.doctorSpecialty,
        startDate: new Date(appointment.startDate),
        endDate: new Date(appointment.endDate),
        status: appointment.isItFinished ? 'Completed' : 'In Progress'
      }));
      console.log(this.patientAppointmentModel);
    });
  }

  getDoctorAppointments() {
    if (this.selectedDoctorId === "") return;

    this.http.get(`https://localhost:7204/api/Appointments/GetAllAppointmentByDoktorId?doctorId=${this.selectedDoctorId}`).subscribe
      ((res: any) => {

        console.log(res.data);

        const data = res.data.map((val: any, i: number) => {
          return {
            id: val.id,
            text: val.patient.fullName,
            startDate: new Date(val.startDate),
            endDate: new Date(val.endDate),
            isItFinished: val.isItFinished,
          }
        })
        this.appointmentsData = data;
        console.log(this.appointmentsData);
      });
  }

  onAppointmentFormOpening(event: any) {
    this.appointmentData = event.appointmentData;
    const doctorName = this.doctors.find(x => x.id === this.selectedDoctorId)?.fullName;
    const specialtyName = this.doctors.find(x => x.id === this.selectedDoctorId)?.doctorDetail?.specialtyName;

    this.appointmentData.doctorName = `${doctorName} - ${specialtyName}`
    event.cancel = true;
    $("#addAppointmentModal").modal('show');
  }

  add(form: NgForm) {
    if (form.valid) {
      const patientId = this.addModel.patient.id === "" ? null : this.addModel.patient.id;
      const data = {
        "doctorId": this.selectedDoctorId,
        "patientId": patientId,
        "firstName": this.addModel.patient.firstName,
        "lastName": this.addModel.patient.lastName,
        "fullAddress": this.addModel.patient.fullAddress,
        "email": this.addModel.patient.email,
        "phoneNumber": this.addModel.patient.phoneNumber,
        "identityNumber": this.addModel.patient.identityNumber,
        "dateOfBirth": this.addModel.patient.dateOfBirth,
        "bloodType": this.addModel.patient.bloodType,
        "startDate": this.appointmentData.startDate,
        "endDate": this.appointmentData.endDate,
        "price": this.doctors.find(p => p.id == this.addModel.doctorId)?.doctorDetail?.price
      };
      console.log(data);
      this.http.post("https://localhost:7204/api/Appointments/Create", data).subscribe(res => {
        $("#addAppointmentModal").modal('hide')
        this.getDoctorAppointments();
        this.addModel = new AppointmentModel();
      })
    }
    $("#addAppointmentModal").modal('hide');
  }


  findPatientByIdentityNumber() {
    if (this.addModel.patient.identityNumber.length < 11) return;
    this.http.post<ResultModel<UserModel>>
      (`https://localhost:7204/api/Appointments/FindPatientByIdentityNumber`, { identityNumber: this.addModel.patient.identityNumber }).subscribe((res) => {
        if (res.data !== undefined && res.data !== null) {
          this.addModel.patient = res.data;
        }
      });
  }

  onAppointmentDeleting(event: any) {
    event.cancel = true;
    const result = confirm("Are you sure you want to delete this appointment?");

    if (result) {
      const id = event.appointmentData.id;
      this.http.get(`https://localhost:7204/api/Appointments/DeleteById?id=${id}`)
        .subscribe((res: any) => {
          this.getDoctorAppointments();
        });
    }
  }
}