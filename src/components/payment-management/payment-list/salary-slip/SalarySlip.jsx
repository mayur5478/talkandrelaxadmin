import React from "react";
import "./salarySlip.scss";
import { Button } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { useGetSinglePayoutQuery } from "../../../../services/listener";
import moment from "moment";
function SalarySlip() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get("id");
  const { data, isLoading, error, refetch } = useGetSinglePayoutQuery(id);
  const navigate = useNavigate();
  const editSalary = (id) => {
    navigate(`/dashboard/payment-management/edit-salary?id=${id}`);
  };
  console.log("data", data);
  const salary = data?.data;
  const listener = data?.listener;
  const wallet = data?.wallet;
  return (
    <div className="salary-slip-main">
      <div className="salary-slip-detail-sec">
        <div className="slip-heading">
          <p>View Payout</p>
          <Button
            onClick={() => editSalary(salary?.id)}
            className="profile-btn"
          >
            Edit Salary
          </Button>
        </div>
        <div className="slip-dates">
          <p>
            <span>Transaction Date:</span>{" "}
            {salary?.transaction_date
              ? moment(salary?.transaction_date).format("DD/MM/YYYY")
              : "-"}
          </p>
          <p>
            <span>Transaction Time:</span>{" "}
            {salary?.transaction_date
              ? moment(salary?.transaction_date).format("hh:mm A")
              : "-"}
          </p>
        </div>
        <div className="slip-paid-details">
          <div className="left-sec">
            <p>Paid Salary to</p>
            <p className="name">{listener?.display_name}</p>
            <p>{listener?.email}</p>
            <p>{listener?.mobile}</p>
            <p>Wallet Amount:</p>
            <p>{wallet?.balance}</p>
          </div>
          <div className="right-sec">
            <div className="box-top">
              <div className="part-1">PAID</div>
              <div className="part-2">
                on{" "}
                {salary?.transaction_date
                  ? moment(salary?.transaction_date).format("DD/MM/YYYY")
                  : "-"}
              </div>
            </div>
            <div className="box-bottom">Rs. {salary?.net_payout_amount}</div>
          </div>
        </div>
        <div className="table">
          <div className="table-heading">Salary Amount</div>
          <div className="table-body">
            <div className="titles">
              <div>No.</div>
              <div>Services</div>
              <div>Time</div>
              <div>Price</div>
              <div>Sub-Total</div>
            </div>
            <div className="values">
              <div>1.</div>
              <div>Call</div>
              <div>
                {Math.floor(salary?.call_time / 60)} hr {salary?.call_time % 60}{" "}
                / diver month
              </div>

              <div>{listener?.voice_charge} / Per Minute</div>
              <div>{salary?.call_amount}</div>
            </div>
            <div className="values">
              <div>2.</div>
              <div>Chat</div>
              <div>
                {" "}
                {Math.floor(salary?.chat_time / 60)} hr {salary?.chat_time % 60}{" "}
                / diver month
              </div>
              <div>{listener?.chat_charge} / Per Minute</div>
              <div>{salary?.chat_amount}</div>
            </div>
            <div className="values">
              <div>3.</div>
              <div>VCall</div>
              <div>
                {" "}
                {Math.floor(salary?.v_call_time / 60)} hr{" "}
                {salary?.v_call_time % 60} / diver month
              </div>
              <div>{listener?.video_charge} / Per Minute</div>
              <div>{salary?.v_call_amount}</div>
            </div>
            <div className="values">
              <div>4.</div>
              <div>Gifts</div>
              <div>-</div>
              <div>-</div>
              <div>{salary?.gift_amount}</div>
            </div>
          </div>

          <div className="table-footer">
            <p>Total Salary Amount:</p>
            <p>
              ₹
              {(
                Number(salary?.chat_amount) +
                Number(salary?.call_amount) +
                Number(salary?.v_call_amount) +
                Number(salary?.gift_amount)
              ).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="table">
          <div className="table-heading">Deduct Amount</div>
          <div className="table-body">
            <div className="titles">
              <div>No.</div>
              <div>Services</div>
              <div></div>
              <div></div>
              <div>Sub-Total</div>
            </div>
            <div className="values">
              <div>4.</div>
              <div>TDS</div>
              <div></div>
              <div></div>
              <div>{salary?.tax_amount}</div>
            </div>
            <div className="values">
              <div>5.</div>
              <div>Session Missed</div>
              <div></div>
              <div></div>
              <div>{salary?.missed_session_penalty}</div>
            </div>
            <div className="values">
              <div>6.</div>
              <div>Leave Penalty</div>
              <div></div>
              <div></div>
              <div>{salary?.leave_penalty}</div>
            </div>
          </div>
          <div className="table-footer">
            <p>Total Deduct Amount:</p>
            <p>
              {" "}
              ₹
              {(
                Number(salary?.tax_amount) +
                Number(salary?.missed_session_penalty) +
                Number(salary?.leave_penalty)
              ).toFixed(2)}
            </p>
          </div>
        </div>
        <div className="total-deduction">
          <div className="left-box">
            <p className="pay-title">Pay Salary</p>
            <p className="pay-date">{moment().format("Do MMMM YYYY")}</p>
            <p className="pay-id">
              ₹{salary?.net_payout_amount} Pay via ABC_123456878 transaction ID.
            </p>
          </div>
          <div className="right-box">
            <div className="amount-box">
              <p className="amount-title">Total Salary Amount:</p>{" "}
              <p className="amount-value">{salary?.payout_amount}</p>
            </div>
            <div className="amount-box">
              <p className="amount-title">Total Deduct Amount:</p>{" "}
              <p className="amount-value">
                -
                {(
                  Number(salary?.tax_amount) +
                  Number(salary?.missed_session_penalty) +
                  Number(salary?.leave_penalty)
                ).toFixed(2)}
              </p>
            </div>

            <div className="amount-box">
              <p className="amount-title">Subtotal:</p>{" "}
              <p className="amount-value">{salary?.net_payout_amount}</p>
            </div>
            {/* <div className="amount-box">
              <p className="amount-title">Paid:</p>{" "}
              <p className="amount-value">{salary?.net_payout_amount }</p>
            </div> */}
            <div className="amount-box">
              <p className="amount-title-main">Salary Amount:</p>{" "}
              <p className="amount-value">{salary?.net_payout_amount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalarySlip;
